var startSeqs = {};
var startNum = 0;

// jQuery FN
$.fn.playSpin = function (options) {
  if (this.length) {
    if ($(this).is(":animated")) return; // Return false if this element is animating
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
    if (!$(this).is(":animated")) return; // Return false if this element is not animating
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
    easing: "swing", // String: easing type for final spin
    time: 3000, // Number: total time of spin animation
    loops: 6, // Number: times it will spin during the animation
    manualStop: false, // Boolean: spin until user manually click to stop
    useStopTime: false, // Boolean: use stop time
    stopTime: 5000, // Number: total time of stop aniation
    stopSeq: "random", // String: sequence of slot machine end animation, random, leftToRight, rightToLeft
    endNum: 0, // Number: animation end at which number/ sequence of list
    onEnd: $.noop, // Function: run on each element spin end, it is passed endNum
    onFinish: $.noop, // Function: run on all element spin end, it is passed endNum
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

    $li.clone().appendTo(slot.$el); // Clone to last row for smooth animation

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
          slot.$el.find("li").last().remove(); // Remove the cloned row

          slot.endAnimation(slot.options.endNum);
          if ($.isFunction(slot.options.onEnd)) {
            slot.options.onEnd(slot.options.endNum);
          }

          // onFinish is every element is finished animation
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
  $(this).toggleClass("clicked"); // Toggle the 'clicked' class on button click
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
// Get all image elements with the class 'moving-image'
var images = document.querySelectorAll(".movingImage");

// Set up animation for each image
images.forEach(function (image, index) {
  // Set initial position and direction for each image
  var position = 0;
  var direction = 1; // 1 for down, -1 for up

  // Function to move the image
  function moveImage() {
    // Update the position
    position += direction;

    // Change direction if the image reaches the top or bottom
    if (position >= 400 || position <= 0) {
      direction *= -1;
    }

    // Apply the new position to the image
    image.style.top = position + "px";
  }

  // Set up the animation loop for each image
  setInterval(moveImage, 10 * (index + 1)); // Adjust the interval for each image
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

//Shine

// Function to check if all numbers in the slot machine are equal
function areNumbersEqual() {
  var numbers = document.querySelectorAll("#example1 ul li");
  var firstNumber = numbers[0].innerText;

  // Check if all numbers are equal to the first number
  return Array.from(numbers).every(function (number) {
    return number.innerText === firstNumber;
  });
}

// Function to add shadow class to the image container and display "You won" text
function addShadowClassAndDisplayText() {
  var imageContainer = document.getElementById("slotImage");
  var wonText = document.createElement("div");
  wonText.innerText = "You won!";
  wonText.classList.add("won-text");

  // Check if all numbers are equal and add the shadow class
  if (areNumbersEqual()) {
    imageContainer.classList.add("shine-gold-shadow");
    imageContainer.appendChild(wonText);

    // Play the winning sound
    var winSound = document.getElementById("winSound");
    winSound.play();

    // Set a timeout to remove the shadow class and text after 3 seconds
    setTimeout(function () {
      imageContainer.classList.remove("shine-gold-shadow");
      wonText.remove();
    }, 3000);

    // Set a timeout to display the "You won" text for 2 seconds
    setTimeout(function () {
      wonText.style.display = "none";
    }, 2000);
  }
}

// Call the function when the spin button is clicked
document.getElementById("btn-example1").addEventListener("click", function () {
  // Your existing spin logic here

  // After the spin, check if numbers are equal and add shadow class and display text
  addShadowClassAndDisplayText();
});
