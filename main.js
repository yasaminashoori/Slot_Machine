var startSeqs = {};
var startNum = 0;

// jQuery FN
$.fn.playSpin = function (options) {
  if (this.length) {
    if ($(this).is(":animated")) return;
    startSeqs["mainSeq" + ++startNum] = {};
    $(this).attr("data-playslot", startNum);

    var total = this.length;
    var thisSeq = 0;

    // Initialize options
    if (typeof options == "undefined") {
      options = new Object();
    }

    // Pre-define end nums
    var endNums = [];
    if (typeof options.endNum != "undefined") {
      if ($.isArray(options.endNum)) {
        endNums = options.endNum;
      } else {
        endNums = [options.endNum];
      }
    }

    for (var i = 0; i < this.length; i++) {
      if (typeof endNums[i] == "undefined") {
        endNums.push(0);
      }
    }

    startSeqs["mainSeq" + startNum]["totalSpinning"] = total;
    return this.each(function () {
      options.endNum = endNums[thisSeq];
      startSeqs["mainSeq" + startNum]["subSeq" + ++thisSeq] = {};
      startSeqs["mainSeq" + startNum]["subSeq" + thisSeq]["spinning"] = true;
      var track = {
        total: total,
        mainSeq: startNum,
        subSeq: thisSeq,
      };
      new slotMachine(this, options, track);
    });
  }
};

$.fn.stopSpin = function () {
  if (this.length) {
    if (!$(this).is(":animated")) return;
    if ($(this)[0].hasAttribute("data-playslot")) {
      $.each(
        startSeqs["mainSeq" + $(this).attr("data-playslot")],
        function (index, obj) {
          obj["spinning"] = false;
        }
      );
    }
  }
};

var slotMachine = function (el, options, track) {
  var slot = this;
  slot.$el = $(el);

  slot.defaultOptions = {
    easing: "swing",
    time: 3000,
    loops: 6,
    manualStop: false,
    useStopTime: false,
    stopTime: 5000,
    stopSeq: "random",
    endNum: 0,
    onEnd: $.noop,
    onFinish: $.noop,
  };

  slot.spinSpeed = 0;
  slot.loopCount = 0;

  slot.init = function () {
    slot.options = $.extend({}, slot.defaultOptions, options);
    slot.setup();
    slot.startSpin();
  };

  slot.setup = function () {
    var $li = slot.$el.find("li").first();
    slot.liHeight = $li.innerHeight();
    slot.liCount = slot.$el.children().length;
    slot.listHeight = slot.liHeight * slot.liCount;
    slot.spinSpeed = slot.options.time / slot.options.loops;

    $li.clone().appendTo(slot.$el);

    // Configure stopSeq
    if (slot.options.stopSeq == "leftToRight") {
      if (track.subSeq != 1) {
        slot.options.manualStop = true;
      }
    } else if (slot.options.stopSeq == "rightToLeft") {
      if (track.total != track.subSeq) {
        slot.options.manualStop = true;
      }
    }
  };

  slot.startSpin = function () {
    slot.$el
      .css("top", -slot.listHeight)
      .animate({ top: "0px" }, slot.spinSpeed, "linear", function () {
        slot.lowerSpeed();
      });
  };

  slot.lowerSpeed = function () {
    slot.loopCount++;

    if (
      slot.loopCount < slot.options.loops ||
      (slot.options.manualStop &&
        startSeqs["mainSeq" + track.mainSeq]["subSeq" + track.subSeq][
          "spinning"
        ])
    ) {
      slot.startSpin();
    } else {
      slot.endSpin();
    }
  };

  slot.endSpin = function () {
    if (slot.options.endNum == 0) {
      slot.options.endNum = slot.randomRange(1, slot.liCount);
    }

    // Error handling if endNum is out of range
    if (slot.options.endNum < 0 || slot.options.endNum > slot.liCount) {
      slot.options.endNum = 1;
    }

    var finalPos = -(slot.liHeight * slot.options.endNum - slot.liHeight);
    var finalTime = (slot.spinSpeed * 1.5 * slot.liCount) / slot.options.endNum;
    if (slot.options.useStopTime) {
      finalTime = slot.options.stopTime;
    }

    slot.$el
      .css("top", -slot.listHeight)
      .animate(
        { top: finalPos },
        parseInt(finalTime),
        slot.options.easing,
        function () {
          slot.$el.find("li").last().remove();

          slot.endAnimation(slot.options.endNum);
          if ($.isFunction(slot.options.onEnd)) {
            slot.options.onEnd(slot.options.endNum);
          }

          if (startSeqs["mainSeq" + track.mainSeq]["totalSpinning"] == 0) {
            var totalNum = "";
            $.each(
              startSeqs["mainSeq" + track.mainSeq],
              function (index, subSeqs) {
                if (typeof subSeqs == "object") {
                  totalNum += subSeqs["endNum"].toString();
                }
              }
            );
            if ($.isFunction(slot.options.onFinish)) {
              slot.options.onFinish(totalNum);
            }
          }
        }
      );
  };

  slot.endAnimation = function (endNum) {
    if (slot.options.stopSeq == "leftToRight" && track.total != track.subSeq) {
      startSeqs["mainSeq" + track.mainSeq]["subSeq" + (track.subSeq + 1)][
        "spinning"
      ] = false;
    } else if (slot.options.stopSeq == "rightToLeft" && track.subSeq != 1) {
      startSeqs["mainSeq" + track.mainSeq]["subSeq" + (track.subSeq - 1)][
        "spinning"
      ] = false;
    }
    startSeqs["mainSeq" + track.mainSeq]["totalSpinning"]--;
    startSeqs["mainSeq" + track.mainSeq]["subSeq" + track.subSeq]["endNum"] =
      endNum;
  };

  slot.randomRange = function (low, high) {
    return Math.floor(Math.random() * (1 + high - low)) + low;
  };

  this.init();
};

$("#btn-example1").click(function () {
  $("#example1 ul").playSpin({});
});

$("#btn-example1").click(function () {
  $(this).toggleClass("clicked");
});

// Play Sound
// Function to play the sound
function makeSound(key) {
  var sound = new Audio("assets/Sounds/01. Above Ground BGM.mp3");
  sound.play();
}

// Play the sound when the page is loaded
window.addEventListener("load", function () {
  makeSound();
});

//Animation onCoins
var images = document.querySelectorAll(".movingImage");

// Set up animation for each image
images.forEach(function (image, index) {
  var position = 0;
  var direction = 1;

  // Function to move the image
  function moveImage() {
    position += direction;

    if (position >= 400 || position <= 0) {
      direction *= -1;
    }

    image.style.top = position + "px";
  }

  setInterval(moveImage, 10 * (index + 1));
});

// Neon Text
const target = window.document.getElementsByTagName("h1")[0];
const flickerLetter = (letter) =>
  `<span style="animation: text-flicker-in-glow ${
    Math.random() * 4
  }s linear both ">${letter}</span>`;
const colorLetter = (letter) =>
  `<span style="color: hsla(${
    Math.random() * 360
  }, 100%, 80%, 1);">${letter}</span>`;
const flickerAndColorText = (text) =>
  text.split("").map(flickerLetter).map(colorLetter).join("");
const neonGlory = (target) =>
  (target.innerHTML = flickerAndColorText(target.textContent));

neonGlory(target);
target.onclick = ({ target }) => neonGlory(target);

//Win!
function displayTextAndSound() {
  alert("You won!");

  playWinningSound();

  setTimeout(function () {
    alert("Winning message disappeared!");
  }, 2000);
}

function playWinningSound() {
  var sound = new Audio("assets/Sounds/Hooray.mp3");
  sound.play();
}
