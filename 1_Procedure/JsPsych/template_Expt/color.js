/*---------------------------------------------------------------------------------
This file runs the color-condition experiment: person labels are first associated
with colors (association learning), followed by overall-color judgments of the dot array.
-----------------------------------------------------------------------------------*/
// Experiment timeline of this file; it is pushed into the main timeline in index.html
var color = {
  timeline: []
};
var currentBlock = 0   // number of completed blocks (shown on the rest screens)
function createPracticeSet(fullArray, n) {
  var shuffled = fullArray.slice();
  for (var i = shuffled.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var temp = shuffled[i];
    shuffled[i] = shuffled[j];
    shuffled[j] = temp;
  }
  return shuffled.slice(0, n);
}

// Condition generator: expand each base condition into two label-position variants (responded with the F/J keys)
function generateDiscriminationConditions(baseTrials, labelMap) {
  var result = [];
  baseTrials.forEach(function(trial) {
    var labels = labelMap[trial.correct_value];
    if (!labels) {
      console.error("No label mapping for", trial.correct_value);
      return;
    }
    // Variant 1: correct-answer label on the left -> press F
    result.push(Object.assign({}, trial, {
      label_left: labels[0],
      label_right: labels[1],
      correct_choice: "f"
    }));
    // Variant 2: correct-answer label on the right -> press J
    result.push(Object.assign({}, trial, {
      label_left: labels[1],
      label_right: labels[0],
      correct_choice: "j"
    }));
  });
  return result;
}

// Replace the placeholder proportion/coherence values in the condition arrays with the
// threshold-calibrated values (easy level only: 0.59 is mapped to the converged threshold)
function updateProportion(arr) {
  for (let i in arr) {
    const proportion = arr[i].target_color_proportion;
    const coherence = arr[i].coherence;
    switch (proportion) {
      case 0.59:
        arr[i].target_color_proportion = window.colorProportion[1];
        break;
    }
    switch (coherence) {
      case 0.20:
        arr[i].coherence = window.coherence[1];
        break;
    }
    // Also update the shape ratio (if the trial has one)
    if (arr[i].hasOwnProperty('dot_shape_ratio')) {
      const shapeRatio = arr[i].dot_shape_ratio;
      switch (shapeRatio) {
        case 0.59:
          arr[i].dot_shape_ratio = window.proportion[1];
          break;
      }
    }
  }
}



// Generator: orthogonally add the shape-dimension difficulty to the color-discrimination conditions (2 shape combinations, easy only)
function addShapeDifficulty(baseTrials) {
  var result = [];
  baseTrials.forEach(function(trial) {
    // shape easy, circle majority
    result.push(Object.assign({}, trial, {
      dot_shape_ratio: 0.59,
      dot_shape: "circle"
    }));
    // shape easy, square majority
    result.push(Object.assign({}, trial, {
      dot_shape_ratio: 0.59,
      dot_shape: "square"
    }));
  });
  return result;
}

// Generator: orthogonally add the color-dimension difficulty to the shape-discrimination conditions (2 color combinations, easy only)
// colorToSelf: if provided ("red" or "blue"), set association according to the majority color
function addColorDifficulty(baseTrials, colorToSelf) {
  var result = [];
  var colorVariants = [
    { target_color_proportion: 0.59, dot_color_final: ["hsl(0, 50%, 50%)", "hsl(225, 50%, 50%)"] },
    { target_color_proportion: 0.59, dot_color_final: ["hsl(225, 50%, 50%)", "hsl(0, 50%, 50%)"] }
  ];
  baseTrials.forEach(function(trial) {
    colorVariants.forEach(function(variant) {
      var newTrial = Object.assign({}, trial, variant);
      if (colorToSelf !== undefined) {
        // Determine the majority color of this variant: dot_color_final[0] = red means red majority, otherwise blue majority
        var isRedMajority = variant.dot_color_final[0] === "hsl(0, 50%, 50%)";
        var majorityColor = isRedMajority ? "red" : "blue";
        newTrial.association = (majorityColor === colorToSelf) ? "self" : "other";
      }
      result.push(newTrial);
    });
  });
  return result;
}


//-------------------- Matching task ------------------------
// The matching task includes: instruction screens, examples, practice, and formal trials

// Instruction screen
var instruction_match = {
  type: jsPsychHtmlKeyboardResponse,
  stimulus: "",
  on_start: function () {
    if (window.subjSex) { 
      if (window.subjSex == "男") {
        labelVar = "他";
      } else if (window.subjSex == "女") {
        labelVar = "她";
      }
    } else {
      labelVar = "TA";
    };
    document.body.style.backgroundColor = "black";
    if (userId % 2 === 0) {
      this.stimulus = `
        <div style="text-align: left; color: white; padding: 10px"> 
          <h3 style="text-align: center; font-size: 30px; margin: 10px">任务一：关联学习</h3>
          <p>接下来，屏幕上会呈现一些运动的圆点，其中一定比例的点为 <span style="color: hsl(0, 50%, 50%)">红色</span> ，其余为<span style="color: hsl(225, 50%, 50%)">蓝色</span> 。</p>
          <p>同时散点图的下方会出现 "我" 或 "${labelVar}" 的文字标签。</p >
          <p>如果大多数点的颜色为<span style="color: hsl(0, 50%, 50%)">红色</span>代表<span style="color: hsl(0, 50%, 50%)">你自己</span> ，为<span style="color: hsl(225, 50%, 50%)">蓝色</span> 代表 <span style="color: hsl(225, 50%, 50%)">他人</span>。</p >
          <p>您需要判断 <span style="font-weight: bold">散点图的整体颜色与文字是否匹配</span> 。</p >
          <ul>
            <li><span style="color: hsl(135, 50%, 50%)">匹配</span>，请按键盘 <span style="color: hsl(135, 50%, 50%)">"F" 键</span>；</li>
            <li><span style="color: red">不匹配</span>，请按键盘 <span style="color: red">"J" 键</span> </li>
          </ul>
          <p style="font-weight: bold">请尽可能又快又准地做出反应</p >
        </div>`;
    } else {
      this.stimulus = `
        <div style="text-align: left; color: white; padding: 10px"> 
          <h3 style="text-align: center; font-size: 30px; margin: 10px">任务一：关联学习</h3>
          <p>接下来，屏幕上会呈现一些运动的圆点，其中一定比例的点为<span style="color: hsl(0, 50%, 50%)">红色</span> ，其余为<span style="color: hsl(225, 50%, 50%)">蓝色</span> 。</p>
          <p>同时散点图的下方会出现 "我" 或 "${labelVar}"  的文字标签。</p >
          <p>如果大多数点的颜色为<span style="color: hsl(225, 50%, 50%)">蓝色</span>代表<span style="color: hsl(225, 50%, 50%)">你自己</span> ，为<span style="color: hsl(0, 50%, 50%)">红色</span>代表<span style="color: hsl(0, 50%, 50%)">他人</span>。</p >
          <p>您需要判断 <span style="font-weight: bold">散点图的整体颜色与文字是否匹配</span> 。</p >
          <ul>
            <li><span style="color: hsl(135, 50%, 50%)">匹配</span>，请按键盘 <span style="color: hsl(135, 50%, 50%)">"F" 键</span>；</li>
            <li><span style="color: red">不匹配</span>，请按键盘 <span style="color: red">"J" 键</span> </li>
          </ul>
          <p style="font-weight: bold">请尽可能又快又准地做出反应</p >
        </div>`;
    }
  },
  response_ends_trial: true,
  choices: " ",
  data: {
    part: "instruction_match",
  },
  on_finish: function() {
    console.log("subjSexTest:", window.subjSex, "lable:", labelVar)
    if (testMode) {
      textMun = true
    } else {
      textMun = false
    }
    return textMun
  }
};

color.timeline.push(instruction_match);


// Practice

var instruction_match_practice = {
  type: jsPsychHtmlKeyboardResponse,
  stimulus: "",
  on_start: function () {
    //document.body.style.backgroundColor = "black";
    if (userId % 2 === 0) {
      this.stimulus = `
        <div style="text-align: left; color: white; padding: 10px">  
          <h3 style="text-align: center; font-size: 30px; margin: 10px;">学习阶段</h3>
          <p>整体颜色为<span style="color: hsl(0, 50%, 50%)">红色</span>代表<span style="color: hsl(0, 50%, 50%)">你自己</span> ，为<span style="color: hsl(225, 50%, 50%)">蓝色</span>代表<span style="color: hsl(225, 50%, 50%)">他人</span>。</p >
          <p>您需要判断 <span style="font-weight: bold">散点图的整体颜色与文字是否匹配</span>，<span style="color: hsl(135, 50%, 50%);">匹配</span> 按 <span style="color: hsl(135, 50%, 50%);">"F" 键</span>；<span style="color: red;">不匹配</span> 按 <span style="color: red;">"J" 键</span> </p >
          <p>正确率达到 90% 及以上才能完成关联学习</p >
          <p>请把左手食指放在 "F" 键上，右手食指放在 "J" 键上</p >
          <p>请按下空格键开始练习</p >
        </div>`;
    } else {
      this.stimulus = `
        <div style="text-align: left; color: white; padding: 10px">  
          <h3 style="text-align: center; font-size: 30px; margin: 10px;">学习阶段</h3>
          <p>整体颜色为<span style="color: hsl(225, 50%, 50%)">蓝色</span>代表<span style="color: hsl(225, 50%, 50%)">你自己</span> ，为<span style="color: hsl(0, 50%, 50%)">红色</span>代表<span style="color: hsl(0, 50%, 50%)">他人</span>。</p >
          <p>您需要判断 <span style="font-weight: bold">散点图的整体颜色与文字是否匹配</span>，<span style="color: hsl(135, 50%, 50%);">匹配</span> 按 <span style="color: hsl(135, 50%, 50%);">"F" 键</span>；<span style="color: red;">不匹配</span> 按 <span style="color: red;">"J" 键</span> </p >
          <p>正确率达到 90% 及以上才能完成关联学习</p >
          <p>请把左手食指放在 "F" 键上，右手食指放在 "J" 键上</p >
          <p>请按下空格键开始练习</p >
        </div>`;
    }
  },
  response_ends_trial: true,
  choices: " ",
  data: {
    part: "instruction_match_practice",
  }
};

//color.timeline.push(instruction_practice);

var fixation = {
  type: jsPsychHtmlKeyboardResponse,
  stimulus: "<p style='font-size: 48px; color: white'>+</p >",
  trial_duration: 500,
  choices: "NO-KEYS",
  data: {
    part: "fixation"
  }
};

// Matching-task conditions (even subjectId: red = self; odd subjectId: blue = self)

let conditions_match_selfRed = [
  // easy only (the hard level was removed)
  { target_color_proportion: 0.59, dot_color_final: ["hsl(0, 50%, 50%)", "hsl(225, 50%, 50%)"], label: "我", correct_choice: "f", isMatch: "match", association: "self", difficulty:"easy"},
  { target_color_proportion: 0.59, dot_color_final: ["hsl(225, 50%, 50%)", "hsl(0, 50%, 50%)"], label: "我", correct_choice: "j", isMatch: "mismatch", association: "other", difficulty:"easy"},
  { target_color_proportion: 0.59, dot_color_final: ["hsl(225, 50%, 50%)", "hsl(0, 50%, 50%)"], label: "他", correct_choice: "f", isMatch: "match", association: "other", difficulty:"easy"},
  { target_color_proportion: 0.59, dot_color_final: ["hsl(0, 50%, 50%)", "hsl(225, 50%, 50%)"], label: "他", correct_choice: "j", isMatch: "mismatch", association: "self", difficulty:"easy"},
];

let conditions_match_selfBlue = [
  // easy only
  { target_color_proportion: 0.59, dot_color_final: ["hsl(225, 50%, 50%)", "hsl(0, 50%, 50%)"], label: "我", correct_choice: "f", isMatch: "match", association: "self", difficulty:"easy"},
  { target_color_proportion: 0.59, dot_color_final: ["hsl(0, 50%, 50%)", "hsl(225, 50%, 50%)"], label: "我", correct_choice: "j", isMatch: "mismatch", association: "other", difficulty:"easy"},
  { target_color_proportion: 0.59, dot_color_final: ["hsl(0, 50%, 50%)", "hsl(225, 50%, 50%)"], label: "他", correct_choice: "f", isMatch: "match", association: "other", difficulty:"easy"},
  { target_color_proportion: 0.59, dot_color_final: ["hsl(225, 50%, 50%)", "hsl(0, 50%, 50%)"], label: "他", correct_choice: "j", isMatch: "mismatch", association: "self", difficulty:"easy"},
]

// The main stimulus of the matching task

var match_RDK = {
  type: jsPsychRdk,
  canvas_height: 600,
  number_of_apertures: 1,
  number_of_dots: 100,
  //post_trial_gap: 500,
  dot_shape_ratio:0.5,
  dot_color: ["hsl(0, 50%, 50%)", "hsl(225, 50%, 50%)"],
  dot_color_final: function () { return jsPsych.timelineVariable("dot_color_final") },
  target_color_proportion: function () { return jsPsych.timelineVariable("target_color_proportion") },
  color_change_delay: 0,
  choices: ["f", "j"],
  correct_choice: function () { return jsPsych.timelineVariable("correct_choice") },
  coherent_direction: 0,
  coherence: 0,
  dot_radius: 5, 
  move_distance: 2.2, 
  aperture_width: 400,
  aperture_height: 400,
  // aperture_center_x: 960,
  aperture_center_y: 300,
  background_color: "black",
  trial_duration: -1,
  data: {
    part: "match_RDK",
    task: "response",
    difficulty: function () { return jsPsych.timelineVariable("difficulty") },
    //correct_response: function () { return jsPsych.timelineVariable("correct_choice") },
    isMatch: function () { return jsPsych.timelineVariable("isMatch") },
    association: function () { return jsPsych.timelineVariable("association") },
    label: function () { return jsPsych.timelineVariable("label") },
  },
  on_start: function () {

    // Replace every label equal to "他" with the gender-appropriate pronoun
    for (let i = 0; i < conditions_match_selfRed.length; i++) {
      if (conditions_match_selfRed[i].label === "他") {
        conditions_match_selfRed[i].label = `${labelVar}`;
      }
      if (conditions_match_selfBlue[i].label === "他") {
        conditions_match_selfBlue[i].label = `${labelVar}`;
      }
    };

    // Replace the proportion values with the threshold-calibrated ones
    updateProportion(conditions_match_selfBlue);
    updateProportion(conditions_match_selfRed);
  
    var displayElement = jsPsych.getDisplayElement();
    
    // Create the fixation cross
    var textDiv = document.createElement("div");
    textDiv.textContent = "+",

    textDiv.style.position = "absolute";
    textDiv.style.fontSize = "48px";
    textDiv.style.top = "50%";          // 从顶部50%位置开始
    textDiv.style.left = "50%";         // 从左侧50%位置开始
    textDiv.style.transform = "translate(-50%, -50%)"; 
    textDiv.style.color = "white";
    displayElement.appendChild(textDiv);


    // Create the image label element
    var img = document.createElement("img");
    // Choose the image path according to the label variable
    const label = jsPsych.timelineVariable("label");
    img.src = (() => {
      switch(jsPsych.timelineVariable("label")) {
        case "我": return "img/self.png";
        case "他": return "img/he.png";    // male other
        case "她": return "img/she.png";  // female other
        default: console.error("未知标签");
      }
    })();
    
    // // Image style settings
    // img.style.position = "absolute";
    // img.style.width = "135px";  // adjust to the actual image size
    // img.style.height = "auto";
    // img.style.bottom = "58%";   // fine-tune the position
    // img.style.left = "50%";
    // img.style.transform = "translateX(-50%)";  // horizontally centered
    // img.style.objectFit = "contain";
    
    // // Add an ID for later manipulation
    // img.id = "label-image";
    // displayElement.appendChild(img);

    // Show the person-label text below the dot array (consistent with the matching-task instructions)
    var labelText = document.createElement("div");
    labelText.textContent = jsPsych.timelineVariable("label");
    labelText.style.position = "absolute";
    labelText.style.bottom = "30%";
    labelText.style.left = "50%";
    labelText.style.transform = "translateX(-50%)";
    labelText.style.color = "white";
    labelText.style.fontSize = "48px";
    labelText.style.fontWeight = "bold";
    labelText.style.fontFamily = "SimHei, sans-serif";
    labelText.style.zIndex = "10";
    displayElement.appendChild(labelText);

    // Hide the stimulus after 1000 ms (block currently disabled)
    /*setTimeout(function() {
      var elements = displayElement.querySelectorAll("*");
      elements.forEach(function(el) {
        el.style.display = 'none';
      });
    }, 100000);*/
  },
  on_finish: function (data) {
    data.correct = jsPsych.pluginAPI.compareKeys(data.response, data.correct_choice);
    console.log('current coherence ', data.target_color_proportion)
  },
};

// Per-trial feedback of the practice phase

var feedbackTrial = {
  type: jsPsychHtmlKeyboardResponse,
  trial_duration: 500,
  stimulus: function () {
    // this function will check the accuracy of the last response and use that information to set
    // the stimulus value on each trial.
    var trial_data = jsPsych.data.get().last(1).values()[0];
    var correct = trial_data.correct;
    var rt = trial_data.rt
    if (rt > 0 && rt < 250) {
      return `<p style='font-size: 60px; color: yellow'>太快!</p>`;
    } else if (rt > 3000) {
      return `<p style='font-size: 60px; color: yellow'>太慢!</p>`;
    } else if (correct) {
      return `<p style='font-size: 60px; color: green'>正确!</p>`;
    } else {
      return `<p style='font-size: 60px; color: red'>错误!</p>`;
    }
  },
};

// Per-trial feedback of the matching task (the "too slow" reminder was removed)
var feedbackTrial_match = {
  type: jsPsychHtmlKeyboardResponse,
  trial_duration: 500,
  stimulus: function () {
    var trial_data = jsPsych.data.get().last(1).values()[0];
    var correct = trial_data.correct;
    var rt = trial_data.rt
    if (rt > 0 && rt < 250) {
      return `<p style='font-size: 60px; color: yellow'>太快!</p>`;
    } else if (correct) {
      return `<p style='font-size: 60px; color: green'>正确!</p>`;
    } else {
      return `<p style='font-size: 60px; color: red'>错误!</p>`;
    }
  },
};

// Compute the overall accuracy of the whole practice phase
// Take the trials of the last block, count the correct ones, and compute the accuracy 
// If the overall accuracy is below 90%, tell the participant to keep practicing

var instruction_retry_block = {
  type: jsPsychHtmlKeyboardResponse,
  stimulus: function() {
    return `
    <div style="text-align: center; color: white; padding: 30px; font-size: 30px">
      <p>您的正确率未达到 90% ，不能进入下一阶段</p>
      <p>请继续学习</p>
      <p>请按空格键继续</p>
    </div>`;
  },
  response_ends_trial: true,
  choices: " ",
  on_start: function() {
    document.body.style.backgroundColor = "black";
  },
  data: {
    part: "instruction_retry_block"
  },
};

// If the accuracy criterion is reached, end the practice
var instruction_practiceEnd = {
  type: jsPsychHtmlKeyboardResponse,
  stimulus: `
  <div style="text-align: center; color: white; padding: 30px; font-size: 30px">
    <p>恭喜您完成学习，请按空格键进入正式任务</p >
  </div>
  `,
  response_ends_trial: true,
  choices: " ",
  on_finish: function () {
    document.body.style.backgroundColor = "black";
  },
  data: {
    part: "instruction_practiceEnd"
  },
};

//========== Matching practice (Block 1 has no criterion; Block 2+ needs 90%; at most 5 blocks) ==========
// Each loop iteration runs one block, and the flow is controlled by loop_function
var match_pract_block = 0;   // current round (0 = block 1, 1 = block 2, 2 = block-2 retry, ...)
var match_pract_retries = 0; // number of block-2 retries

// Transition screen between Block 1 and Block 2: tells participants that the accuracy criterion applies from now on
var instruction_block2_enter = {
  type: jsPsychHtmlKeyboardResponse,
  stimulus: `
  <div style="text-align: left; color: white; padding: 10px; font-size: 26px">
    <p>第一组已完成！</p>
    <p>即将进入下一组</p>
    <p style="color: hsl(50, 80%, 60%); font-weight: bold;">注意：从本组测试开始，正确率需达到 90% 及以上才能进入后面的正式任务</p>
    <p>请按空格键继续</p>
  </div>
  `,
  response_ends_trial: true,
  choices: " ",
  on_start: function() {
    document.body.style.backgroundColor = "black";
  },
  data: {
    part: "instruction_block2_enter"
  },
};

var practice_block_selfRed = {
  timeline: [
    // Instruction screen moved outside the loop so it is shown only once and does not affect the trials inside the loop
    instruction_match_practice,
    {
      timeline: [
        // The trials of one block
        {
          timeline: [fixation, match_RDK, feedbackTrial_match],
          timeline_variables: conditions_match_selfRed,
          repetitions: 12,
          randomize_order: true
        },
        // After Block 1, show the transition screen (match_pract_block is still 0 here; it is only incremented in loop_function)
        {
          timeline: [instruction_block2_enter],
          conditional_function: function() { return match_pract_block === 0; }
        },
        // After Block 2+: show the completion screen if the criterion is met, otherwise the retry screen
        {
          timeline: [instruction_practiceEnd],
          conditional_function: function() {
            if (match_pract_block < 1) return false;
            var trials = jsPsych.data.get().filter({task: 'response'}).last(48);
            var correct_trials = trials.filter({correct: true});
            return Math.round(correct_trials.count() / trials.count() * 100) >= window.pract_pass_rate;
          }
        },
        {
          timeline: [instruction_retry_block],
          conditional_function: function() {
            if (match_pract_block < 1) return false;
            var trials = jsPsych.data.get().filter({task: 'response'}).last(48);
            var correct_trials = trials.filter({correct: true});
            return Math.round(correct_trials.count() / trials.count() * 100) < window.pract_pass_rate;
          }
        },
      ],
      loop_function: function () {
        match_pract_block++;
        if (match_pract_block === 1) {
          // Block 1 just finished -> continue to Block 2
          return true;
        }
        // Block 2+ finished: check the accuracy
        var trials = jsPsych.data.get().filter({task: 'response'}).last(48);
        var correct_trials = trials.filter({correct: true});
        var accuracy = Math.round(correct_trials.count() / trials.count() * 100);
        console.log("[match_practice] Block", match_pract_block, "accuracy:", accuracy);
        if (accuracy >= window.pract_pass_rate) {
          console.log("[match_practice] Passed!");
          return false;
        }
        // below the criterion
        match_pract_retries++;
        console.log("[match_practice] Failed, retry", match_pract_retries);
        if (match_pract_retries >= 4) {
          alert("多次尝试后仍未达到90%的正确率，请联系主试。");
          return false;
        }
        return true;
      },
    }
  ],
};

var practice_block_selfBlue = {
  timeline: [
    // Instruction screen moved outside the loop so it is shown only once and does not affect the trials inside the loop
    instruction_match_practice,
    {
      timeline: [
        {
          timeline: [fixation, match_RDK, feedbackTrial_match],
          timeline_variables: conditions_match_selfBlue,
          repetitions: 12,
          randomize_order: true
        },
        {
          timeline: [instruction_block2_enter],
          conditional_function: function() { return match_pract_block === 0; }
        },
        {
          timeline: [instruction_practiceEnd],
          conditional_function: function() {
            if (match_pract_block < 1) return false;
            var trials = jsPsych.data.get().filter({task: 'response'}).last(48);
            var correct_trials = trials.filter({correct: true});
            return Math.round(correct_trials.count() / trials.count() * 100) >= window.pract_pass_rate;
          }
        },
        {
          timeline: [instruction_retry_block],
          conditional_function: function() {
            if (match_pract_block < 1) return false;
            var trials = jsPsych.data.get().filter({task: 'response'}).last(48);
            var correct_trials = trials.filter({correct: true});
            return Math.round(correct_trials.count() / trials.count() * 100) < window.pract_pass_rate;
          }
        },
      ],
      loop_function: function () {
        match_pract_block++;
        if (match_pract_block === 1) return true;
        var trials = jsPsych.data.get().filter({task: 'response'}).last(48);
        var correct_trials = trials.filter({correct: true});
        var accuracy = Math.round(correct_trials.count() / trials.count() * 100);
        console.log("[match_practice] Block", match_pract_block, "accuracy:", accuracy);
        if (accuracy >= window.pract_pass_rate) return false;
        match_pract_retries++;
        if (match_pract_retries >= 4) {
          alert("多次尝试后仍未达到85%的正确率，请联系主试。");
          return false;
        }
        return true;
      },
    }
  ],
};

var practice_selfRed = {
  timeline: [practice_block_selfRed],
  conditional_function: function () {
    if (userId % 2 === 0) {
      console.log("match_selfRed");
      return true;
    } else {
      return false;
    }
  }
};

var practice_selfBlue = {
  timeline: [practice_block_selfBlue],
  conditional_function: function () {
    if (userId % 2 !== 0) {
      console.log("match_selfBlue");
      return true;
    } else {
      return false;
    }
  }
};

var practice_match = {
  timeline: [practice_selfRed, practice_selfBlue]
};

color.timeline.push(practice_match);

//-------- The formal association-learning phase was removed (only the practice phase remains) --------


var rest_rdk = {
  type: jsPsychHtmlKeyboardResponse,
  stimulus: function() {
    return `
      <div style="text-align: center; color: white; padding: 35px; font-size: 35px">
        <p>恭喜您，已完成 ${currentBlock + 1}/2</p>
        <p>请先休息 <span id="countdown" style="color:red; font-weight:bold;">30</span> 秒</p>
        <p id="spaceTip" style="margin-top:20px; opacity:0.5;">休息结束后可按空格键继续</p>
      </div>
    `;
  },
  response_ends_trial: false, // forced rest, keys are ignored during it
  choices: " ", // space key only
  trial_duration: null,

  // increment the block counter
  on_start: function() {
    currentBlock += 1;
  },

  on_load: function() {
    let restTime = 30;
    const countdownDom = document.getElementById('countdown');
    const spaceTipDom = document.getElementById('spaceTip');
    const trial = this;

    // countdown timer
    const timer = setInterval(() => {
      restTime -= 1;
      countdownDom.textContent = restTime;

      if (restTime <= 0) {
        clearInterval(timer);
        trial.response_ends_trial = true; // time is up, allow a key press to continue
        spaceTipDom.style.opacity = "1";
        spaceTipDom.style.color = "#32cd32";
      }
    }, 1000);
  },

  on_finish: function() {
    document.body.style.backgroundColor = "black";
  },
  data: { part: "instruction_rest" }
};

/*---------- Association learning ends here! Below is the RDK color-judgment task -----------*/

// Instruction screens (start, practice, and end)

var instruction_RDK_beginning = {
  type: jsPsychHtmlKeyboardResponse,
  stimulus: `
      <div style="text-align: left; color: white; padding: 10px"> 
        <h3 style="text-align: center; font-size: 30px; margin: 10px">接下来是：整体颜色判断任务</h3>
        <p>屏幕上会呈现一些运动的圆点，其中一定比例的点为 <span style="color: hsl(0, 50%, 50%)">红色</span> ，其余为 <span style="color: hsl(225, 50%, 50%)">蓝色</span>，</p>
        <p>您需要判断 <span style="font-weight: bold">散点图的整体颜色（即大多数点的颜色）是红色还是蓝色 </span>：</p >
        <p>散点图下方会显示"红"和"蓝"的文字标签，</p>
        <ul>
          <li>若整体为 <span style="color: hsl(0, 50%, 50%)">红色</span>，请按对应文字标签所在侧的键（左侧按 <span style="font-weight: bold">F</span>，右侧按 <span style="font-weight: bold">J</span>）</li>
          <li>若整体为 <span style="color: hsl(225, 50%, 50%)">蓝色</span>，请按对应文字标签所在侧的键（左侧按 <span style="font-weight: bold">F</span>，右侧按 <span style="font-weight: bold">J</span>）</li>
        </ul>
        <p>请按下空格键进入练习阶段</p>
      </div>`,
  response_ends_trial: true,
  choices: " ",
  data: {
    part: "instruction_RDK_beginning",
  }
};

// These instruction screens are pushed into the timeline later

var instruction_RDK_practice = {
  type: jsPsychHtmlKeyboardResponse,
  stimulus: `
    <div style="text-align: center; color: white; padding: 35px; font-size: 30px">
      <p>请把左手食指放在键盘 <span style="font-weight: bold">"F"键</span> 上，右手食指放在 <span style="font-weight: bold">"J"键</span> 上</p >
      <p>请按下空格键进入【练习阶段】</p >
    </div>
    `,
  response_ends_trial: true,
  choices: " ",
  on_start: function() {
    currentBlock = 0
  },
  on_finish: function () {
    document.body.style.backgroundColor = "black";
  },
  data: {
    part: "instruction_RDK_practice"
  }
};

var instruction_RDK_practice_end = {
  type: jsPsychHtmlKeyboardResponse,
  stimulus: `
    <div style="text-align: center; color: white; padding: 30px; font-size: 30px">
      <p>练习结束！</p >
      <p>继续练习请按 "Q" 键 </p>
      <p>进入正式实验请按空格键, 正式实验仅在每组测试结束后提供反馈</p>
      <p style="font-weight: bold">请尽可能又快又准地做出反应</p >
    </div>
    `,
  response_ends_trial: true,
  choices: ["q", " "],
  on_finish: function () {
    document.body.style.backgroundColor = "black";
  },
  data: {
    part: "instruction_RDK_practice_end"
  },
};

var instruction_RDK_formal_beginning = {
  type: jsPsychHtmlKeyboardResponse,
  stimulus: `
    <div style="text-align: center; color: white; padding: 35px; font-size: 30px">
      <p>请把左手食指放在键盘 <span style="font-weight: bold">"F"键</span> 上，右手食指放在 <span style="font-weight: bold">"J"键</span> 上</p >
      <p>请按下空格键开始【正式实验】</p >
    </div>
    `,
  response_ends_trial: true,
  choices: " ",
  on_finish: function () {
    document.body.style.backgroundColor = "black";
  },
  data: {
    part: "instruction_RDk_formal_beginning"
  }
};


// The overall-color judgment task

// Conditions of the overall-color judgment task

// Base conditions of the color-discrimination task (identity-relevant): target = color;
// the shape-dimension difficulty is added orthogonally via addShapeDifficulty
var base_RDK_selfRed_core = [
  // target=color, association=self, easy, red-majority
  { target_color_proportion: 0.59, dot_color_final: ["hsl(0, 50%, 50%)", "hsl(225, 50%, 50%)"], difficulty: "easy", association: "self",
    coherent_direction: 0, coherence: 0, correct_value: "red", task_type: "relevant", data_part: "RDK_color" },
  // target=color, association=other, easy, blue-majority
  { target_color_proportion: 0.59, dot_color_final: ["hsl(225, 50%, 50%)", "hsl(0, 50%, 50%)"], difficulty: "easy", association: "other",
    coherent_direction: 0, coherence: 0, correct_value: "blue", task_type: "relevant", data_part: "RDK_color" }
];
var base_RDK_selfRed = addShapeDifficulty(base_RDK_selfRed_core);

var conditions_RDK_selfRed = generateDiscriminationConditions(base_RDK_selfRed, {
  "red": ["红", "蓝"],
  "blue": ["蓝", "红"]
});

var base_RDK_selfBlue_core = [
  // target=color, association=self, easy, blue-majority
  { target_color_proportion: 0.59, dot_color_final: ["hsl(225, 50%, 50%)", "hsl(0, 50%, 50%)"], difficulty: "easy", association: "self",
    coherent_direction: 0, coherence: 0, correct_value: "blue", task_type: "relevant", data_part: "RDK_color" },
  // target=color, association=other, easy, red-majority
  { target_color_proportion: 0.59, dot_color_final: ["hsl(0, 50%, 50%)", "hsl(225, 50%, 50%)"], difficulty: "easy", association: "other",
    coherent_direction: 0, coherence: 0, correct_value: "red", task_type: "relevant", data_part: "RDK_color" }
];
var base_RDK_selfBlue = addShapeDifficulty(base_RDK_selfBlue_core);

var conditions_RDK_selfBlue = generateDiscriminationConditions(base_RDK_selfBlue, {
  "red": ["红", "蓝"],
  "blue": ["蓝", "红"]
});

/* ==================== Identity-choice conditions (identity judgment) ==================== */
// Participants judge whether the dot array represents "self" or "he/she", inferring identity from the associated dimension
// Target = color (identity); the shape-dimension difficulty is added orthogonally via addShapeDifficulty
// selfRed (even userId): red = self, blue = other
var base_overlap_selfRed_core = [
  // self, easy (red=self, red-majority)
  { target_color_proportion: 0.59, dot_color_final: ["hsl(0, 50%, 50%)", "hsl(225, 50%, 50%)"], difficulty: "easy", association: "self",
    coherent_direction: 0, coherence: 0, correct_value: "self", task_type: "overlap", data_part: "RDK_overlap" },
  // other, easy (blue=other, blue-majority)
  { target_color_proportion: 0.59, dot_color_final: ["hsl(225, 50%, 50%)", "hsl(0, 50%, 50%)"], difficulty: "easy", association: "other",
    coherent_direction: 0, coherence: 0, correct_value: "other", task_type: "overlap", data_part: "RDK_overlap" }
];
var base_overlap_selfRed = addShapeDifficulty(base_overlap_selfRed_core);

// selfBlue (odd userId): blue = self, red = other
var base_overlap_selfBlue_core = [
  // self, easy (blue=self, blue-majority)
  { target_color_proportion: 0.59, dot_color_final: ["hsl(225, 50%, 50%)", "hsl(0, 50%, 50%)"], difficulty: "easy", association: "self",
    coherent_direction: 0, coherence: 0, correct_value: "self", task_type: "overlap", data_part: "RDK_overlap" },
  // other, easy (red=other, red-majority)
  { target_color_proportion: 0.59, dot_color_final: ["hsl(0, 50%, 50%)", "hsl(225, 50%, 50%)"], difficulty: "easy", association: "other",
    coherent_direction: 0, coherence: 0, correct_value: "other", task_type: "overlap", data_part: "RDK_overlap" }
];
var base_overlap_selfBlue = addShapeDifficulty(base_overlap_selfBlue_core);

var conditions_overlap_selfRed = generateDiscriminationConditions(base_overlap_selfRed, {
  "self": ["我", "他"],
  "other": ["他", "我"]
});

var conditions_overlap_selfBlue = generateDiscriminationConditions(base_overlap_selfBlue, {
  "self": ["我", "他"],
  "other": ["他", "我"]
});

// The unified RDK stimulus of the discrimination tasks (used for the identity-relevant, identity-irrelevant, and identity-choice conditions)
var RDK_discrimination = {
  type: jsPsychRdk,
  number_of_dots: 100,
  dot_color: ["hsl(0, 50%, 50%)", "hsl(225, 50%, 50%)"],
  choices: ["f", "j"],
  correct_choice: function () { return jsPsych.timelineVariable("correct_choice") }, 
  coherent_direction: function () { return jsPsych.timelineVariable("coherent_direction") },
  coherence: function () { return jsPsych.timelineVariable("coherence") },
  dot_color_final: function () { return jsPsych.timelineVariable("dot_color_final") },
  target_color_proportion: function () { return jsPsych.timelineVariable("target_color_proportion") },
  dot_shape: function () { return jsPsych.timelineVariable("dot_shape") },
  dot_shape_ratio: function () { return jsPsych.timelineVariable("dot_shape_ratio") },
  dot_radius: 5,
  move_distance: 2.2,
  aperture_width: 400,
  aperture_height: 400,
  // aperture_center_x: 960,
  // aperture_center_y: 330,
  background_color: "black",
  trial_duration: -1,
  data: {
    part: function () { return jsPsych.timelineVariable("data_part") },
    task: "response",
    task_type: function () { return jsPsych.timelineVariable("task_type") },
    difficulty: function () { return jsPsych.timelineVariable("difficulty") },
    association: function () { return jsPsych.timelineVariable("association") },
    correct_value: function () { return jsPsych.timelineVariable("correct_value") },
    label_left: function () { return jsPsych.timelineVariable("label_left") },
    label_right: function () { return jsPsych.timelineVariable("label_right") }
  },
  on_start: function() {
    // Update the proportion/coherence values of all condition arrays
    updateProportion(conditions_RDK_selfRed);
    updateProportion(conditions_RDK_selfBlue);
    updateProportion(conditions_shape_selfRed);
    updateProportion(conditions_shape_selfBlue);
    if (typeof conditions_overlap_selfRed !== 'undefined') {
      updateProportion(conditions_overlap_selfRed);
      updateProportion(conditions_overlap_selfBlue);
    }

    // Create the text labels below the dot array
    var label_left = jsPsych.timelineVariable("label_left");
    var label_right = jsPsych.timelineVariable("label_right");
    var taskType = jsPsych.timelineVariable("task_type");

    // Identity-choice condition: replace "他" with the gender-appropriate pronoun
    if (taskType === "overlap") {
      var otherLabel = (typeof labelVar !== 'undefined' && labelVar) ? labelVar : "TA";
      if (label_left === "他") { label_left = otherLabel; }
      if (label_right === "他") { label_right = otherLabel; }
    }

    var displayElement = jsPsych.getDisplayElement();

    // Left label
    var leftDiv = document.createElement("div");
    leftDiv.textContent = label_left;
    leftDiv.style.position = "absolute";
    leftDiv.style.bottom = "20%";
    leftDiv.style.left = "30%";
    leftDiv.style.color = "white";
    leftDiv.style.fontSize = "48px";
    leftDiv.style.fontWeight = "bold";
    leftDiv.style.fontFamily = "SimHei, sans-serif";
    leftDiv.style.zIndex = "10";
    displayElement.appendChild(leftDiv);

    // Right label
    var rightDiv = document.createElement("div");
    rightDiv.textContent = label_right;
    rightDiv.style.position = "absolute";
    rightDiv.style.bottom = "20%";
    rightDiv.style.right = "30%";
    rightDiv.style.color = "white";
    rightDiv.style.fontSize = "48px";
    rightDiv.style.fontWeight = "bold";
    rightDiv.style.fontFamily = "SimHei, sans-serif";
    rightDiv.style.zIndex = "10";
    displayElement.appendChild(rightDiv);
  },
  on_finish: function(data){
    data.correct = jsPsych.pluginAPI.compareKeys(data.response, data.correct_choice);
  },
};

// Keep this alias for compatibility with the existing block references
var RDK = RDK_discrimination;

// Practice phase

var practiceSet_RDK_selfRed = createPracticeSet(conditions_RDK_selfRed, 8);
var practice_block_RDK_selfRed = {
  timeline: [
    instruction_RDK_beginning,
    instruction_RDK_practice,
    {
      timeline: [fixation, RDK, feedbackTrial],
      timeline_variables: practiceSet_RDK_selfRed,
      repetitions: 2,
      randomize_order: true
    },
    instruction_RDK_practice_end
  ],
  loop_function: function () {
    var data = jsPsych.data.get().last(1).values()[0];
    if (jsPsych.pluginAPI.compareKeys(data.response, "q")) {
      return true;
    } else {
      return false;
    }
  },
};

var practiceSet_RDK_selfBlue = createPracticeSet(conditions_RDK_selfBlue, 8);
var practice_block_RDK_selfBlue = {
  timeline: [
    instruction_RDK_beginning,
    instruction_RDK_practice,
    {
      timeline: [fixation, RDK, feedbackTrial],
      timeline_variables: practiceSet_RDK_selfBlue,
      repetitions: 2,
      randomize_order: true
    },
    instruction_RDK_practice_end
  ],
  loop_function: function () {
    var data = jsPsych.data.get().last(1).values()[0];
    if (jsPsych.pluginAPI.compareKeys(data.response, "q")) {
      return true;
    } else {
      return false;
    }
  },
};

var practice_RDK_selfRed = {
  timeline: [practice_block_RDK_selfRed],
  conditional_function: function () {
    if (userId % 2 === 0) {
      console.log("practice_selfRed");
      return true;
    } else {
      return false;
    }
  }
};

var practice_RDK_selfBlue = {
  timeline: [practice_block_RDK_selfBlue],
  conditional_function: function () {
    if (userId % 2 !== 0) {
      console.log("practice_selfBlue");
      return true;
    } else {
      return false;
    }
  }
};


var practice_block_color = {
  timeline: [practice_RDK_selfRed, practice_RDK_selfBlue]
};

// color.timeline.push(practice_block_color); // not pushed here - all tasks are pushed together at the end

// Formal phase

// Set up the block feedback

var feedbackBlock_RDK = {
  type: jsPsychHtmlKeyboardResponse,
  trial_duration: 3000,
  stimulus: function() {
    var trials = jsPsych.data.get().filter({task: 'response'}).last(64)
    var correct_trials = trials.filter({correct: true});
    var accuracy = Math.round(correct_trials.count() / trials.count() * 100);
    var rt = Math.round(trials.select('rt').mean());
    console.log({ accuracy: accuracy, rt: rt });
    return `<p style='font-size: 35px; color: white'>本组测试中，您的正确率为： ${accuracy}% ，平均反应时为：${rt}毫秒。</p>`;   
  }
};

var formal_block_RDK_selfRed = {
  timeline: [
    instruction_RDK_formal_beginning,
    // Block 1
    {
      timeline: [fixation, RDK],
      timeline_variables: conditions_RDK_selfRed,
      repetitions: 8,
      randomize_order: true
    },
    feedbackBlock_RDK,
    rest_rdk,
    // Block 2
    {
      timeline: [fixation, RDK],
      timeline_variables: conditions_RDK_selfRed,
      repetitions: 8,
      randomize_order: true
    },
    feedbackBlock_RDK,
  ],
};

var formal_block_RDK_selfBlue = {
  timeline: [
    instruction_RDK_formal_beginning,
    // Block 1
    {
      timeline: [fixation, RDK],
      timeline_variables: conditions_RDK_selfBlue,
      repetitions: 8,
      randomize_order: true
    },
    feedbackBlock_RDK,
    rest_rdk,
    // Block 2
    {
      timeline: [fixation, RDK],
      timeline_variables: conditions_RDK_selfBlue,
      repetitions: 8,
      randomize_order: true
    },
    feedbackBlock_RDK,
  ],
};

var formal_RDK_selfRed = {
  timeline: [formal_block_RDK_selfRed],
  conditional_function: function () {
    if (userId % 2 === 0) {
      console.log("formal_selfRed");
      return true;
    } else {
      return false;
    }
  }
};

var formal_RDK_selfBlue = {
  timeline: [formal_block_RDK_selfBlue],
  conditional_function: function () {
    if (userId % 2 !== 0) {
      console.log("formal_selfBlue");
      return true;
    } else {
      return false;
    }
  }
};


var formal_block_color = {
  timeline: [formal_RDK_selfRed, formal_RDK_selfBlue]
};


// Instruction screen of the identity-choice task
var instruction_overlap = {
  type: jsPsychHtmlKeyboardResponse,
  stimulus: "",
  on_start: function () {
    currentBlock = 0;
    //document.body.style.backgroundColor = "black";
    if (userId % 2 === 0) {
      this.stimulus = `
        <div style="text-align: left; color: white; padding: 10px">  
          <h3 style="text-align: center; font-size: 30px; margin: 10px;">接下来是：身份判断任务</h3>
          <p>屏幕上会呈现运动的彩色圆点，</p>
          <p>整体颜色为<span style="color: hsl(0, 50%, 50%)">红色</span>代表<span style="color: hsl(0, 50%, 50%)">你自己</span> ，为<span style="color: hsl(225, 50%, 50%)">蓝色</span>代表<span style="color: hsl(225, 50%, 50%)">他人</span>。</p >
          <p>您需要判断散点图代表的是<span style="font-weight: bold">您自己</span>还是<span style="font-weight: bold">他人</span>：</p>
          <p>散点图下方会显示"我"和"他/她"的文字标签，</p>
          <ul>
            <li>若代表<span style="font-weight: bold">"我"</span>，请按文字标签所在侧的对应键</li>
            <li>若代表<span style="font-weight: bold">"他/她"</span>，请按文字标签所在侧的对应键</li>
          </ul>
          <p>请按下空格键进入练习阶段</p>
        </div>`
    } else {
      this.stimulus = `
        <div style="text-align: left; color: white; padding: 10px">  
          <h3 style="text-align: center; font-size: 30px; margin: 10px;">接下来是：身份判断任务</h3>
          <p>屏幕上会呈现运动的彩色圆点，</p>
          <p>整体颜色为<span style="color: hsl(225, 50%, 50%)">蓝色</span>代表<span style="color: hsl(225, 50%, 50%)">你自己</span> ，为<span style="color: hsl(0, 50%, 50%)">红色</span>代表<span style="color: hsl(0, 50%, 50%)">他人</span>。</p >
          <p>您需要判断散点图代表的是<span style="font-weight: bold">您自己</span>还是<span style="font-weight: bold">他人</span>：</p>
          <p>散点图下方会显示"我"和"他/她"的文字标签，</p>
          <ul>
            <li>若代表<span style="font-weight: bold">"我"</span>，请按文字标签所在侧的对应键</li>
            <li>若代表<span style="font-weight: bold">"他/她"</span>，请按文字标签所在侧的对应键</li>
          </ul>
          <p>请按下空格键进入练习阶段</p>
        </div>`;
    }
  },
  response_ends_trial: true,
  choices: " ",
  data: {
    part: "instruction_overlap",
  }
};

// Practice phase
var practiceSet_overlap_selfRed = createPracticeSet(conditions_overlap_selfRed, 8);
var practice_block_overlap_selfRed = {
  timeline: [
    instruction_overlap, 
    instruction_RDK_practice,
    {
      timeline: [fixation, RDK_discrimination, feedbackTrial],
      timeline_variables: practiceSet_overlap_selfRed,
      repetitions: 2,
      randomize_order: true
    },
    instruction_RDK_practice_end
  ],
  loop_function: function () {
    var data = jsPsych.data.get().last(1).values()[0];
    if (jsPsych.pluginAPI.compareKeys(data.response, "q")) {
      return true;
    } else {
      return false;
    }
  },
};

var practiceSet_overlap_selfBlue = createPracticeSet(conditions_overlap_selfBlue, 8);
var practice_block_overlap_selfBlue = {
  timeline: [
    instruction_overlap,
    instruction_RDK_practice,
    {
      timeline: [fixation, RDK_discrimination, feedbackTrial],
      timeline_variables: practiceSet_overlap_selfBlue,
      repetitions: 2,
      randomize_order: true
    },
    instruction_RDK_practice_end
  ],
  loop_function: function () {
    var data = jsPsych.data.get().last(1).values()[0];
    if (jsPsych.pluginAPI.compareKeys(data.response, "q")) {
      return true;
    } else {
      return false;
    }
  },
};

var practice_overlap_selfRed = {
  timeline: [practice_block_overlap_selfRed],
  conditional_function: function () {
    return (userId % 2 === 0);
  }
};

var practice_overlap_selfBlue = {
  timeline: [practice_block_overlap_selfBlue],
  conditional_function: function () {
    return (userId % 2 !== 0);
  }
};

var practice_block_overlap = {
  timeline: [practice_overlap_selfRed, practice_overlap_selfBlue]
};

// Formal phase
var formal_block_overlap_selfRed = {
  timeline: [
    instruction_RDK_formal_beginning,
    // Block 1
    {
      timeline: [fixation, RDK_discrimination],
      timeline_variables: conditions_overlap_selfRed,
      repetitions: 8,
      randomize_order: true
    },
    feedbackBlock_RDK,
    rest_rdk,
    // Block 2
    {
      timeline: [fixation, RDK_discrimination],
      timeline_variables: conditions_overlap_selfRed,
      repetitions: 8,
      randomize_order: true
    },
    feedbackBlock_RDK,
  ],
};

var formal_block_overlap_selfBlue = {
  timeline: [
    instruction_RDK_formal_beginning,
    // Block 1
    {
      timeline: [fixation, RDK_discrimination],
      timeline_variables: conditions_overlap_selfBlue,
      repetitions: 8,
      randomize_order: true
    },
    feedbackBlock_RDK,
    rest_rdk,
    // Block 2
    {
      timeline: [fixation, RDK_discrimination],
      timeline_variables: conditions_overlap_selfBlue,
      repetitions: 8,
      randomize_order: true
    },
    feedbackBlock_RDK,
  ],
};

var formal_overlap_selfRed = {
  timeline: [formal_block_overlap_selfRed],
  conditional_function: function () {
    return (userId % 2 === 0);
  }
};

var formal_overlap_selfBlue = {
  timeline: [formal_block_overlap_selfBlue],
  conditional_function: function () {
    return (userId % 2 !== 0);
  }
};

var formal_block_overlap = {
  timeline: [formal_overlap_selfRed, formal_overlap_selfBlue]
};

/*---------- The overall-color judgment task ends here! Below is the shape-judgment task -----------*/


// Instruction screens (start, practice, and end)

var instruction_motion_beginning = {
  type: jsPsychHtmlKeyboardResponse,
  stimulus: `
    <div style="text-align: left; color: white; padding: 10px"> 
      <h3 style="text-align: center; font-size: 30px; margin: 10px">接下来是：形状判断任务</h3>
      <p>屏幕上会呈现一些彩色圆点，其中一定比例的点为 <span style="font-weight: bold">圆形</span>，其余为 <span style="font-weight: bold">正方形</span>，</p>
      <p>您需要判断 <span style="font-weight: bold">散点图中哪种形状的数量更多（即大多数点的形状）是圆形还是正方形</span></p >
      <p>散点图下方会显示"圆"和"方"的文字标签，</p>
      <ul>
        <li>若大多数点为 <span style="font-weight: bold">圆形</span>，请按对应文字标签所在侧的键（左侧按 <span style="font-weight: bold">F</span>，右侧按 <span style="font-weight: bold">J</span>）</li>
        <li>若大多数点为 <span style="font-weight: bold">正方形</span>，请按对应文字标签所在侧的键（左侧按 <span style="font-weight: bold">F</span>，右侧按 <span style="font-weight: bold">J</span>）</li>
      </ul>
      <p>请按下空格键进入练习阶段</p>
    </div>`,
  response_ends_trial: true,
  choices: " ",
  on_start: function() {
    currentBlock = 0
  },
  data: {
    part: "instruction_RDK_beginning", 
  }
};

// These instruction screens are pushed into the timeline later

var instruction_motion = {
  type: jsPsychHtmlKeyboardResponse,
  stimulus: `
  <div style="text-align: center; color: white; padding: 35px; font-size: 30px">
    <p>请把左手食指放在键盘 <span style="font-weight: bold">"F"键</span> 上，右手食指放在 <span style="font-weight: bold">"J"键</span> 上</p >
    <p>请按下空格键开始</p >
  </div>
  `,
  response_ends_trial: true,
  choices: " ",
  on_finish: function() {
    document.body.style.backgroundColor = "black";
  },
  data: {
    part: "instruction"
  }
};

// The "end" instruction screen is the same for all tasks



// Base conditions of the shape-discrimination task (identity-irrelevant): target = shape;
// the color-dimension difficulty is added orthogonally via addColorDifficulty (easy only)
// Note: association is set automatically by addColorDifficulty from the color (selfRed: red = self, blue = other)
var base_shape_selfRed_core = [
  // target=shape, easy, circle
  { dot_shape_ratio: 0.59, dot_shape: "circle", difficulty: "easy",
    coherent_direction: 0, coherence: 0, correct_value: "circle", task_type: "irrelevant", data_part: "RDK_shape" },
  // target=shape, easy, square
  { dot_shape_ratio: 0.59, dot_shape: "square", difficulty: "easy",
    coherent_direction: 0, coherence: 0, correct_value: "square", task_type: "irrelevant", data_part: "RDK_shape" }
];
// selfRed: red = self, blue = other
var base_shape_selfRed = addColorDifficulty(base_shape_selfRed_core, "red");

// selfBlue (odd userId): blue = self, red = other
var base_shape_selfBlue_core = [
  // target=shape, easy, square
  { dot_shape_ratio: 0.59, dot_shape: "square", difficulty: "easy",
    coherent_direction: 0, coherence: 0, correct_value: "square", task_type: "irrelevant", data_part: "RDK_shape" },
  // target=shape, easy, circle
  { dot_shape_ratio: 0.59, dot_shape: "circle", difficulty: "easy",
    coherent_direction: 0, coherence: 0, correct_value: "circle", task_type: "irrelevant", data_part: "RDK_shape" }
];
// selfBlue: blue = self, red = other
var base_shape_selfBlue = addColorDifficulty(base_shape_selfBlue_core, "blue");

// Generate the full condition arrays directly (no A/B grouping needed)
var conditions_shape_selfRed = generateDiscriminationConditions(base_shape_selfRed, {
  "circle": ["圆", "方"],
  "square": ["方", "圆"]
});
var conditions_shape_selfBlue = generateDiscriminationConditions(base_shape_selfBlue, {
  "circle": ["圆", "方"],
  "square": ["方", "圆"]
});

// Practice and formal blocks of the shape-discrimination task

var practiceSet_shape_selfBlue = createPracticeSet(conditions_shape_selfBlue, 8);
var practice_block_shape_selfBlue = {
  timeline: [
    instruction_motion_beginning,
    instruction_motion,
    {
      timeline: [fixation, RDK_discrimination, feedbackTrial],
      timeline_variables: practiceSet_shape_selfBlue,
      repetitions: 2,
      randomize_order: true
    },
    instruction_RDK_practice_end
  ],
  loop_function: function(){
    var data = jsPsych.data.get().last(1).values()[0];
    if (jsPsych.pluginAPI.compareKeys(data.response, "q")) {
      return true;
    } else {
      return false;
    }
  },
};

var practiceSet_shape_selfRed = createPracticeSet(conditions_shape_selfRed, 8);
var practice_block_shape_selfRed = {
  timeline: [
    instruction_motion_beginning,
    instruction_motion,
    {
      timeline: [fixation, RDK_discrimination, feedbackTrial],
      timeline_variables: practiceSet_shape_selfRed,
      repetitions: 2,
      randomize_order: true
    },
    instruction_RDK_practice_end
  ],
  loop_function: function(){
    var data = jsPsych.data.get().last(1).values()[0];
    if (jsPsych.pluginAPI.compareKeys(data.response, "q")) {
      return true;
    } else {
      return false;
    }
  },
};

var practice_shape_selfBlue = {
  timeline: [practice_block_shape_selfBlue],
  conditional_function: function(){
    if (userId % 2 !== 0) {
      console.log("practice_shape_selfBlue");
      return true;
    } else {
      return false;
    }
  }
};

var practice_shape_selfRed = {
  timeline: [practice_block_shape_selfRed],
  conditional_function: function(){
    if (userId % 2 === 0) {
      console.log("practice_shape_selfRed");
      return true;
    } else {
      return false;
    }
  }
};

var practice_block_shape = { 
  timeline: [practice_shape_selfBlue, practice_shape_selfRed]
};

var formal_block_shape_selfBlue = {
  timeline: [
    instruction_RDK_formal_beginning,
    // Block 1
    {
      timeline: [fixation, RDK_discrimination],
      timeline_variables: conditions_shape_selfBlue,
      repetitions: 8,
      randomize_order: true
    },
    feedbackBlock_RDK,
    rest_rdk,
    // Block 2
    {
      timeline: [fixation, RDK_discrimination],
      timeline_variables: conditions_shape_selfBlue,
      repetitions: 8,
      randomize_order: true
    },
    feedbackBlock_RDK,
  ],
};

var formal_block_shape_selfRed = {
  timeline: [
    instruction_RDK_formal_beginning,
    // Block 1
    {
      timeline: [fixation, RDK_discrimination],
      timeline_variables: conditions_shape_selfRed,
      repetitions: 8,
      randomize_order: true
    },
    feedbackBlock_RDK,
    rest_rdk,
    // Block 2
    {
      timeline: [fixation, RDK_discrimination],
      timeline_variables: conditions_shape_selfRed,
      repetitions: 8,
      randomize_order: true
    },
    feedbackBlock_RDK,
  ],
};

var formal_shape_selfBlue = {
  timeline: [formal_block_shape_selfBlue],
  conditional_function: function(){
    if (userId % 2 !== 0) {
      console.log("formal_shape_selfBlue");
      return true;
    } else {
      return false;
    }
  }
};

var formal_shape_selfRed = {
  timeline: [formal_block_shape_selfRed],
  conditional_function: function(){
    if (userId % 2 === 0) {
      console.log("formal_shape_selfRed");
      return true;
    } else {
      return false;
    }
  }
};

var formal_block_shape = { 
  timeline: [formal_shape_selfBlue, formal_shape_selfRed]
};

// The 6 counterbalanced orders of the three discrimination tasks
// Each order contains: practice -> formal for each task
// The order is selected at runtime from userId (cycling every 6 participants) for between-subject counterbalancing

var block_order_0 = {
  timeline: [practice_block_shape, formal_block_shape, practice_block_color, formal_block_color, practice_block_overlap, formal_block_overlap],
  conditional_function: function() {
    var val = ((window.userId - 1) % 6 + 6) % 6;
    console.log("[block_order_0] window.userId:", window.userId, "computed:", val, "match:", val === 0);
    return val === 0;
  },
  on_start: function() { console.log("任务呈现顺序 [0]: 形状→颜色→重合"); }
};
var block_order_1 = {
  timeline: [practice_block_shape, formal_block_shape, practice_block_overlap, formal_block_overlap, practice_block_color, formal_block_color],
  conditional_function: function() {
    var val = ((window.userId - 1) % 6 + 6) % 6;
    console.log("[block_order_1] window.userId:", window.userId, "computed:", val, "match:", val === 1);
    return val === 1;
  },
  on_start: function() { console.log("任务呈现顺序 [1]: 形状→重合→颜色"); }
};
var block_order_2 = {
  timeline: [practice_block_color, formal_block_color, practice_block_shape, formal_block_shape, practice_block_overlap, formal_block_overlap],
  conditional_function: function() {
    var val = ((window.userId - 1) % 6 + 6) % 6;
    console.log("[block_order_2] window.userId:", window.userId, "computed:", val, "match:", val === 2);
    return val === 2;
  },
  on_start: function() { console.log("任务呈现顺序 [2]: 颜色→形状→重合"); }
};
var block_order_3 = {
  timeline: [practice_block_color, formal_block_color, practice_block_overlap, formal_block_overlap, practice_block_shape, formal_block_shape],
  conditional_function: function() {
    var val = ((window.userId - 1) % 6 + 6) % 6;
    console.log("[block_order_3] window.userId:", window.userId, "computed:", val, "match:", val === 3);
    return val === 3;
  },
  on_start: function() { console.log("任务呈现顺序 [3]: 颜色→重合→形状"); }
};
var block_order_4 = {
  timeline: [practice_block_overlap, formal_block_overlap, practice_block_shape, formal_block_shape, practice_block_color, formal_block_color],
  conditional_function: function() {
    var val = ((window.userId - 1) % 6 + 6) % 6;
    console.log("[block_order_4] window.userId:", window.userId, "computed:", val, "match:", val === 4);
    return val === 4;
  },
  on_start: function() { console.log("任务呈现顺序 [4]: 重合→形状→颜色"); }
};
var block_order_5 = {
  timeline: [practice_block_overlap, formal_block_overlap, practice_block_color, formal_block_color, practice_block_shape, formal_block_shape],
  conditional_function: function() {
    var val = ((window.userId - 1) % 6 + 6) % 6;
    console.log("[block_order_5] window.userId:", window.userId, "computed:", val, "match:", val === 5);
    return val === 5;
  },
  on_start: function() { console.log("任务呈现顺序 [5]: 重合→颜色→形状"); }
};

var block_RDK = {
  timeline: [block_order_0, block_order_1, block_order_2, block_order_3, block_order_4, block_order_5],
  on_start: function() { console.log("[block_RDK] Starting discrimination tasks, window.userId:", window.userId); }
};

color.timeline.push(block_RDK);

// over