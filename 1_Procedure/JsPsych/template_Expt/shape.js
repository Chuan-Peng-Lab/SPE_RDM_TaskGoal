/*---------------------------------------------------------------------------------
This file runs the shape-condition experiment: person labels are first associated
with shapes (circle/square), followed by overall-shape judgments of the dot array.
-----------------------------------------------------------------------------------*/

var randomInteger = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1)) + min
};

// Fisher-Yates shuffle: randomly draw n trials (without replacement) from the full condition array
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

// Experiment timeline of this file; it is pushed into the main timeline in index.html
var shape = {
  timeline: []
};
let textMun;   // test-mode flag returned by the matching instruction screen

let labelVar = "";   // pronoun label ("他"/"她"/"TA") set from the participant's sex   // pronoun label ("他"/"她"/"TA") set from the participant's sex
var currentBlock = 0   // number of completed blocks (shown on the rest screens)
function generateDiscriminationConditions(baseTrials, labelMap) {
  // labelMap: { correctValue: [labelForCorrect, labelForOther] }
  // e.g. for the motion task: { "left": ["左", "右"], "right": ["左", "右"] }
  // e.g. for the overlap task: { "self": ["我", "他"], "other": ["我", "他"] }
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

// Generator: orthogonally add the color-dimension difficulty to the shape-discrimination conditions (2 color combinations, easy only)
function addColorDifficulty(baseTrials) {
  var result = [];
  baseTrials.forEach(function(trial) {
    // color easy, red majority
    result.push(Object.assign({}, trial, {
      target_color_proportion: 0.59,
      dot_color_final: ["hsl(0, 50%, 50%)", "hsl(225, 50%, 50%)"]
    }));
    // color easy, blue majority
    result.push(Object.assign({}, trial, {
      target_color_proportion: 0.59,
      dot_color_final: ["hsl(225, 50%, 50%)", "hsl(0, 50%, 50%)"]
    }));
  });
  return result;
}

// Generator: orthogonally add the shape-dimension difficulty to the color-discrimination conditions (2 shape combinations, easy only)
// shapeToSelf: if provided, set association from dot_shape ("circle" = self or "square" = self)
function addShapeDifficulty(baseTrials, shapeToSelf) {
  var result = [];
  var shapeVariants = [
    { dot_shape_ratio: 0.59, dot_shape: "circle" },
    { dot_shape_ratio: 0.59, dot_shape: "square" }
  ];
  baseTrials.forEach(function(trial) {
    shapeVariants.forEach(function(variant) {
      var newTrial = Object.assign({}, trial, variant);
      if (shapeToSelf !== undefined) {
        newTrial.association = (variant.dot_shape === shapeToSelf) ? "self" : "other";
      }
      result.push(newTrial);
    });
  });
  return result;
}

// Replace the placeholder coherence/proportion values in the condition arrays with the threshold-calibrated values
function updateCoherence(arr) {
  for (let i in arr) {
    const coherence = arr[i].coherence;
    const proportion = arr[i].target_color_proportion;
    switch (coherence) {
      case 0.20:
        arr[i].coherence = window.coherence[1];
        break;
    }
    switch (proportion) {
      case 0.59:
        arr[i].target_color_proportion = window.colorProportion[1];
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


//-------------------- Perceptual matching task ------------------------

// Includes: instruction screens, examples, practice, and formal trials

// Instruction screen (association learning)
var instruction_match = {
  type: jsPsychHtmlKeyboardResponse,
  stimulus: "",
  on_start: function() {
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
      this.stimulus =  `
      <div style="text-align: left; color: white; padding: 10px"> 
        <h3 style="text-align: center; font-size: 30px; margin: 10px;">学习阶段</h3>
        <p>接下来，屏幕上会呈现一些运动的彩色圆点和正方形，</p>
        <p>其中一定比例为<span style="font-weight: bold">圆形</span>，其余为<span style="font-weight: bold">正方形</span>。</p>
        <p>如果大多数点的形状为<span style="font-weight: bold">圆形</span>代表<span style="font-weight: bold">你自己</span>，为<span style="font-weight: bold">正方形</span>代表<span style="font-weight: bold">他人</span>。</p >
        <p>同时散点图的下方会出现 "我" 或 "${labelVar}" 的文字标签。</p >
        <p>您需要判断 <span style="font-weight: bold">散点图的主要形状与文字是否匹配</span> ：</p >
        <ul>
          <li><span style="color: hsl(135, 50%, 50%)">匹配</span>，请按键盘 <span style="color: hsl(135, 50%, 50%)">"F" 键</span></li>
          <li><span style="color: red">不匹配</span>，请按键盘 <span style="color: red">"J" 键</span> </li>
        </ul>
        <p style="font-weight: bold">请尽可能又快又准地做出反应</p >
      </div>`;
    } else {
      this.stimulus =  `
      <div style="text-align: left; color: white; padding: 10px"> 
        <h3 style="text-align: center; font-size: 30px; margin: 10px">学习阶段</h3>
        <p>接下来，屏幕上会呈现一些运动的彩色圆点和正方形，</p>
        <p>如果大多数点的形状为<span style="font-weight: bold">正方形</span>代表<span style="font-weight: bold">你自己</span>，为<span style="font-weight: bold">圆形</span>代表<span style="font-weight: bold">他人</span>。</p >
        <p>同时散点图的下方会出现 "我" 或 "${labelVar}" 的文字标签。</p >
        <p>您需要判断 <span style="font-weight: bold">散点图的主要形状与文字是否匹配</span> ：</p >
        <ul>
          <li><span style="color: hsl(135, 50%, 50%)">匹配</span>，请按键盘 <span style="color: hsl(135, 50%, 50%)">"F" 键</span></li>
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

shape.timeline.push(instruction_match);

// Practice

var instruction_match_practice = {
  type: jsPsychHtmlKeyboardResponse,
  stimulus: "",
  on_start: function() {
    if (userId % 2 === 0) {
      this.stimulus =  `
      <div style="text-align: left; color: white; padding: 10px">  
        <h3 style="text-align: center; font-size: 30px; margin: 10px;">学习阶段</h3>
        <p>大多数点为<span style="font-weight: bold">圆形</span>代表<span style="font-weight: bold">你自己</span>，为<span style="font-weight: bold">正方形</span>代表<span style="font-weight: bold">他人</span>。</p >
        <p>您需要判断 <span style="font-weight: bold">散点图的主要形状与文字是否匹配</span>，<span style="color: hsl(135, 50%, 50%);">匹配</span> 按 <span style="color: hsl(135, 50%, 50%);">"F" 键</span>；<span style="color: red;">不匹配</span> 按 <span style="color: red;">"J" 键</span></p >
        <p>正确率达到 90% 及以上才能进入正式任务 </p >
        <p>请把左手食指放在 "F" 键上，右手食指放在 "J" 键上</p >
        <p>请按下空格键开始练习</p >
      </div>`;
    } else {
      this.stimulus =  `
      <div style="text-align: left; color: white; padding: 10px">  
        <h3 style="text-align: center; font-size: 30px; margin: 10px;">学习阶段</h3>
        <p>大多数点为<span style="font-weight: bold">正方形</span>代表<span style="font-weight: bold">你自己</span>，为<span style="font-weight: bold">圆形</span>代表<span style="font-weight: bold">他人</span>。</p >
        <p>您需要判断 <span style="font-weight: bold">散点图的主要形状与文字是否匹配</span>，<span style="color: hsl(135, 50%, 50%);">匹配</span> 按 <span style="color: hsl(135, 50%, 50%);">"F" 键</span>；<span style="color: red;">不匹配</span> 按 <span style="color: red;">"J" 键</span></p >
        <p>正确率达到 90% 及以上才能进入正式任务 </p >
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

//shape.timeline.push(instruction_practice);

// Fixation cross shown before each trial
fixation = { 
  type: jsPsychHtmlKeyboardResponse,
  stimulus: "<p style='font-size: 48px; color: white'>+</p >",
  trial_duration: 500,
  choices: "NO-KEYS",
  data: {
     part: "fixation"
  }
};

// Matching-task conditions (shape association)
// even subjectId: circle majority = self, square majority = other
// odd subjectId: square majority = self, circle majority = other
// 2 difficulties x 2 association types x 2 match types = 8 conditions

let conditions_match_selfLeft = [
  // easy only (the hard level was removed)
  { dot_shape_ratio: 0.59, dot_shape: "circle", label: "我", correct_choice: "f", isMatch: "match", association: "self", difficulty: "easy" },
  { dot_shape_ratio: 0.59, dot_shape: "circle", label: "他", correct_choice: "j", isMatch: "mismatch", association: "self", difficulty: "easy" },
  { dot_shape_ratio: 0.59, dot_shape: "square", label: "他", correct_choice: "f", isMatch: "match", association: "other", difficulty: "easy" },
  { dot_shape_ratio: 0.59, dot_shape: "square", label: "我", correct_choice: "j", isMatch: "mismatch", association: "other", difficulty: "easy" }
];

let conditions_match_selfRight = [
  // easy only
  { dot_shape_ratio: 0.59, dot_shape: "square", label: "我", correct_choice: "f", isMatch: "match", association: "self", difficulty: "easy" },
  { dot_shape_ratio: 0.59, dot_shape: "square", label: "他", correct_choice: "j", isMatch: "mismatch", association: "self", difficulty: "easy" },
  { dot_shape_ratio: 0.59, dot_shape: "circle", label: "他", correct_choice: "f", isMatch: "match", association: "other", difficulty: "easy" },
  { dot_shape_ratio: 0.59, dot_shape: "circle", label: "我", correct_choice: "j", isMatch: "mismatch", association: "other", difficulty: "easy" }
];

// The main stimulus of the matching task (shape association)

var match_RDK = {
  type: jsPsychRdk,
  canvas_height: 600,
  number_of_apertures: 1,
  number_of_dots: 100,
  dot_color: ["hsl(0, 50%, 50%)", "hsl(225, 50%, 50%)"],
  dot_color_final: ["hsl(0, 50%, 50%)", "hsl(225, 50%, 50%)"],
  target_color_proportion: 0.5,
  dot_shape_ratio: function () { return jsPsych.timelineVariable("dot_shape_ratio") },
  dot_shape: function () { return jsPsych.timelineVariable("dot_shape") },
  choices: ["f", "j"],
  correct_choice: function () {return jsPsych.timelineVariable("correct_choice")}, 
  coherent_direction: 0,
  coherence: 0,
  dot_radius: 5, 
  move_distance: 2.2, 
  aperture_width: 400,
  aperture_height: 400,
  // aperture_center_x: 960,
  aperture_center_y: 300, // smaller = higher on the screen
  background_color: "black",
  trial_duration: -1,
  data: {
    part: "match_RDK",
    task: "response",
    difficulty: function () { return jsPsych.timelineVariable("difficulty") },
    isMatch: function () { return jsPsych.timelineVariable("isMatch") },
    association: function () { return jsPsych.timelineVariable("association") },
    label: function () { return jsPsych.timelineVariable("label") },
    dot_shape_ratio: function () { return jsPsych.timelineVariable("dot_shape_ratio") },
    dot_shape: function () { return jsPsych.timelineVariable("dot_shape") },
  },
  on_start: function() {

    // Replace every label equal to "他" with the gender-appropriate pronoun
    for (let i = 0; i < conditions_match_selfLeft.length; i++) {
      if (conditions_match_selfLeft[i].label === "他") {
        conditions_match_selfLeft[i].label = `${labelVar}`;
      }
      if (conditions_match_selfRight[i].label === "他") {
        conditions_match_selfRight[i].label = `${labelVar}`;
      }
    };

    // Update the shape-ratio values (obtained from the threshold test)
    updateCoherence(conditions_match_selfLeft);
    updateCoherence(conditions_match_selfRight);
    
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
    // img.style.bottom = "20%";   // fine-tune the position
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
    }, 3000);*/
  },
  on_finish: function(data){
    data.correct = jsPsych.pluginAPI.compareKeys(data.response, data.correct_choice);
    console.log('current coherence ', data.coherence)
  },
};

// Per-trial feedback of the practice phase

var feedbackTrial = {
  type: jsPsychHtmlKeyboardResponse,
  trial_duration: 500,
  stimulus: function(){
    // this function will check the accuracy of the last response and use that information to set
    // the stimulus value on each trial.
    var trial_data = jsPsych.data.get().last(1).values()[0];
    var correct = trial_data.correct;
    var rt = trial_data.rt
    if(rt > 0 && rt < 250){
      return `<p style='font-size: 60px; color: yellow'>太快!</p>`; 
    } else if(rt > 3000) {
      return `<p style='font-size: 60px; color: yellow'>太慢!</p>`; 
    } else if(correct){
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
  stimulus: function(){
    var trial_data = jsPsych.data.get().last(1).values()[0];
    var correct = trial_data.correct;
    var rt = trial_data.rt
    if(rt > 0 && rt < 250){
      return `<p style='font-size: 60px; color: yellow'>太快!</p>`; 
    } else if(correct){
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
var match_pract_block = 0;
var match_pract_retries = 0;

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

var practice_block_selfLeft = {
  timeline: [
    // Instruction screen moved outside the loop so it is shown only once and does not affect the trials inside the loop
    instruction_match_practice,
    {
      timeline: [
        // The trials of one block
        {
          timeline: [fixation, match_RDK, feedbackTrial_match],
          timeline_variables: conditions_match_selfLeft,
          repetitions: 12,
          randomize_order: true
        },
        // After Block 1, show the transition screen (match_pract_block is still 0 here; it is only incremented in loop_function)
        {
          timeline: [instruction_block2_enter],
          conditional_function: function() { return match_pract_block === 0; }
        },
        // After Block 2+: show the completion screen if the criterion is met, otherwise the retry screen (continue looping)
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
          return false;
        }
        // below the criterion
        match_pract_retries++;
        if (match_pract_retries >= 4) {
          alert("多次尝试后仍未达到90%的正确率，请联系主试。");
          return false;
        }
        return true;
      },
    }
  ],
};

var practice_block_selfRight = {
  timeline: [
    instruction_match_practice,
    {
      timeline: [
        {
          timeline: [fixation, match_RDK, feedbackTrial_match],
          timeline_variables: conditions_match_selfRight,
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
          alert("多次尝试后仍未达到90%的正确率，请联系主试。");
          return false;
        }
        return true;
      },
    }
  ],
};

var practice_selfLeft = {
  timeline: [practice_block_selfLeft],
  conditional_function: function(){
    if (userId % 2 === 0) {
      console.log("match_selfLeft");
      return true;
    } else {
      return false;
    }
  }
};

var practice_selfRight = {
  timeline: [practice_block_selfRight],
  conditional_function: function(){
    if (userId % 2 !== 0) {
      console.log("match_selfRight");
      return true;
    } else {
      return false;
    }
  }
};

var practice_match = { 
  timeline: [practice_selfLeft, practice_selfRight]
};

shape.timeline.push(practice_match);

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

/*---------- Association learning ends here! Below are the RDK discrimination tasks -----------*/


// Instruction screens (start, practice, and end)

var instruction_RDK_beginning = {
  type: jsPsychHtmlKeyboardResponse,
  stimulus: `
    <div style="text-align: left; color: white; padding: 10px"> 
      <h3 style="text-align: center; font-size: 30px; margin: 10px">接下来是：形状判断任务</h3>
      <p>屏幕上会呈现一些彩色圆点，其中一定比例的点为 <span style="font-weight: bold">圆形</span>，其余为 <span style="font-weight: bold">正方形</span>，</p>
      <p>您需要判断 <span style="font-weight: bold">散点图中哪种形状的数量更多</span></p >
      <p>散点图下方会显示"圆"和"方"的文字标签，</p>
      <ul>
        <li>若大多数为 <span style="font-weight: bold">圆形</span>，请按对应文字标签所在侧的键（左侧按 <span style="font-weight: bold">F</span>，右侧按 <span style="font-weight: bold">J</span>）</li>
        <li>若大多数为 <span style="font-weight: bold">正方形</span>，请按对应文字标签所在侧的键（左侧按 <span style="font-weight: bold">F</span>，右侧按 <span style="font-weight: bold">J</span>）</li>
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
  on_finish: function() {
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
  on_finish: function() {
    document.body.style.backgroundColor = "black";
  },
  data: {
    part: "instruction_RDk_formal_beginning"
  }
};


// Base conditions of the shape-discrimination task (identity-relevant), expanded by the generator
// selfLeft (even userId): circle majority = self, square majority = other
// Core conditions (target dimension = shape only); the color-dimension difficulty is added orthogonally via addColorDifficulty
var base_shape_selfLeft_core = [
  // easy only
  { dot_shape_ratio: 0.59, dot_shape: "circle", difficulty: "easy", association: "self",correct_value: "circle", task_type: "relevant", data_part: "RDK_shape" },
  { dot_shape_ratio: 0.59, dot_shape: "square", difficulty: "easy", association: "other",correct_value: "square", task_type: "relevant", data_part: "RDK_shape" }
];
var base_shape_selfLeft = addColorDifficulty(base_shape_selfLeft_core);

// selfRight (odd userId): square majority = self, circle majority = other
var base_shape_selfRight_core = [
  // easy only
  { dot_shape_ratio: 0.59, dot_shape: "square", difficulty: "easy", association: "self",correct_value: "square", task_type: "relevant", data_part: "RDK_shape" },
  { dot_shape_ratio: 0.59, dot_shape: "circle", difficulty: "easy", association: "other",correct_value: "circle", task_type: "relevant", data_part: "RDK_shape" }
];
var base_shape_selfRight = addColorDifficulty(base_shape_selfRight_core);

// Generate the full two-label variants of the shape-discrimination conditions
var conditions_shape_selfLeft = generateDiscriminationConditions(base_shape_selfLeft, {
  "circle": ["圆", "方"],
  "square": ["方", "圆"]
});

var conditions_shape_selfRight = generateDiscriminationConditions(base_shape_selfRight, {
  "circle": ["圆", "方"],
  "square": ["方", "圆"]
});


// The main stimulus

// The unified RDK stimulus of the discrimination tasks (used for the identity-relevant, identity-irrelevant, and identity-choice conditions)
// Uses the F/J keys and shows text labels below the dot array; the label positions are set by the condition arrays
var RDK_discrimination = {
  type: jsPsychRdk,
  number_of_dots: 100,
  dot_color: ["hsl(0, 50%, 50%)", "hsl(225, 50%, 50%)"],
  dot_shape_ratio: 0.5,
  coherent_direction: 0,
  coherence: 0,
  // dot_side_length: 4,
  choices: ["f", "j"],
  correct_choice: function () { return jsPsych.timelineVariable("correct_choice") }, 
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
    // Update the coherence/proportion values of all condition arrays
    updateCoherence(conditions_color_selfLeft);
    updateCoherence(conditions_color_selfRight);
    updateCoherence(conditions_shape_selfLeft);
    updateCoherence(conditions_shape_selfRight);
    if (typeof conditions_overlap_selfLeft !== 'undefined') {
      updateCoherence(conditions_overlap_selfLeft);
      updateCoherence(conditions_overlap_selfRight);
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


// Practice and formal blocks of the shape-discrimination task
var practiceSet_shape_selfLeft = createPracticeSet(conditions_shape_selfLeft, 8);
var practice_block_shape_selfLeft = {
  timeline: [
    instruction_RDK_beginning,
    instruction_RDK_practice,
    {
      timeline: [fixation, RDK_discrimination, feedbackTrial],
      timeline_variables: practiceSet_shape_selfLeft,
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

var practiceSet_shape_selfRight = createPracticeSet(conditions_shape_selfRight, 8);
var practice_block_shape_selfRight = {
  timeline: [
    instruction_RDK_beginning,
    instruction_RDK_practice,
    {
      timeline: [fixation, RDK_discrimination, feedbackTrial],
      timeline_variables: practiceSet_shape_selfRight,
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

var practice_shape_selfLeft = {
  timeline: [practice_block_shape_selfLeft],
  conditional_function: function(){
    if (userId % 2 === 0) {
      console.log("practice_shape_selfLeft");
      return true;
    } else {
      return false;
    }
  }
};

var practice_shape_selfRight = {
  timeline: [practice_block_shape_selfRight],
  conditional_function: function(){
    if (userId % 2 !== 0) {
      console.log("practice_shape_selfRight");
      return true;
    } else {
      return false;
    }
  }
};

var practice_block_shape = { 
  timeline: [practice_shape_selfLeft, practice_shape_selfRight]
};

var formal_block_shape_selfLeft = {
  timeline: [
    instruction_RDK_formal_beginning,
    // Block 1
    {
      timeline: [fixation, RDK_discrimination],
      timeline_variables: conditions_shape_selfLeft,
      repetitions: 8,
      randomize_order: true
    },
    feedbackBlock_RDK,
    rest_rdk,
    // Block 2
    {
      timeline: [fixation, RDK_discrimination],
      timeline_variables: conditions_shape_selfLeft,
      repetitions: 8,
      randomize_order: true
    },
    feedbackBlock_RDK,
  ],
};

var formal_block_shape_selfRight = {
  timeline: [
    instruction_RDK_formal_beginning,
    // Block 1
    {
      timeline: [fixation, RDK_discrimination],
      timeline_variables: conditions_shape_selfRight,
      repetitions: 8,
      randomize_order: true
    },
    feedbackBlock_RDK,
    rest_rdk,
    // Block 2
    {
      timeline: [fixation, RDK_discrimination],
      timeline_variables: conditions_shape_selfRight,
      repetitions: 8,
      randomize_order: true
    },
    feedbackBlock_RDK,
  ],
};

var formal_shape_selfLeft = {
  timeline: [formal_block_shape_selfLeft],
  conditional_function: function(){
    if (userId % 2 === 0) {
      console.log("formal_shape_selfLeft");
      return true;
    } else {
      return false;
    }
  }
};

var formal_shape_selfRight = {
  timeline: [formal_block_shape_selfRight],
  conditional_function: function(){
    if (userId % 2 !== 0) {
      console.log("formal_shape_selfRight");
      return true;
    } else {
      return false;
    }
  }
};

var formal_block_shape = { 
  timeline: [formal_shape_selfLeft, formal_shape_selfRight]
};

// ---------------------------------- Overall-color judgment task -----------------------------

// Instruction screens (start, practice, and end)

var instruction_color_beginning = {
  type: jsPsychHtmlKeyboardResponse,
  stimulus: `
      <div style="text-align: left; color: white; padding: 10px"> 
        <h3 style="text-align: center; font-size: 30px; margin: 10px">接下来是：整体颜色判断任务</h3>
        <p>屏幕上会呈现一些运动的圆点，其中一定比例的点为 <span style="color: hsl(0, 50%, 50%)">红色</span> ，其余为 <span style="color: hsl(225, 50%, 50%)">蓝色</span>，</p>
        <p>您需要判断 <span style="font-weight: bold">散点图的整体颜色（即大多数点的颜色）是红色还是蓝色 </span></p >
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

var instruction_color = {
  type: jsPsychHtmlKeyboardResponse,
  stimulus: `
    <div style="text-align: center; color: white; padding: 35px; font-size: 30px">
      <p>请把左手食指放在键盘 <span style="font-weight: bold">"F"键</span> 上，右手食指放在 <span style="font-weight: bold">"J"键</span> 上</p >
      <p>请按下空格键开始</p >
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
    part: "instruction"
  }
};

// The "end" instruction screen is the same for all tasks


// Conditions of the overall-color judgment task

// Base conditions of the color-discrimination task (identity-irrelevant): target = color;
// the shape-dimension difficulty is added orthogonally via addShapeDifficulty (easy only)
// Note: association is set automatically by addShapeDifficulty from the shape; it is not predefined in the core array
var base_color_selfLeft_core = [
  // target=color, easy, red-majority
  { target_color_proportion: 0.59, dot_color_final: ["hsl(0, 50%, 50%)", "hsl(225, 50%, 50%)"], difficulty: "easy",
    coherent_direction: 0, coherence: 0, correct_value: "red", task_type: "irrelevant", data_part: "RDK_color" },
  // target=color, easy, blue-majority
  { target_color_proportion: 0.59, dot_color_final: ["hsl(225, 50%, 50%)", "hsl(0, 50%, 50%)"], difficulty: "easy",
    coherent_direction: 0, coherence: 0, correct_value: "blue", task_type: "irrelevant", data_part: "RDK_color" }
];
// selfLeft: circle = self, square = other
var base_color_selfLeft = addShapeDifficulty(base_color_selfLeft_core, "circle");
var conditions_color_selfLeft = generateDiscriminationConditions(base_color_selfLeft, {
  "red": ["红", "蓝"],
  "blue": ["蓝", "红"]
});

// Base conditions of the color-discrimination task (identity-irrelevant): target = color;
// the shape-dimension difficulty is added orthogonally via addShapeDifficulty (easy only)
var base_color_selfRight_core = [
  // target=color, easy, red-majority
  { target_color_proportion: 0.59, dot_color_final: ["hsl(0, 50%, 50%)", "hsl(225, 50%, 50%)"], difficulty: "easy",
    coherent_direction: 0, coherence: 0, correct_value: "red", task_type: "irrelevant", data_part: "RDK_color" },
  // target=color, easy, blue-majority
  { target_color_proportion: 0.59, dot_color_final: ["hsl(225, 50%, 50%)", "hsl(0, 50%, 50%)"], difficulty: "easy",
    coherent_direction: 0, coherence: 0, correct_value: "blue", task_type: "irrelevant", data_part: "RDK_color" }
];
// selfRight: square = self, circle = other
var base_color_selfRight = addShapeDifficulty(base_color_selfRight_core, "square");
var conditions_color_selfRight = generateDiscriminationConditions(base_color_selfRight, {
  "red": ["红", "蓝"],
  "blue": ["蓝", "红"]
});

/* ==================== Identity-choice conditions (identity judgment) ==================== */
// Participants judge whether the dot array represents "self" or "he/she", inferring identity from the associated dimension
// Target = shape (identity); the color-dimension difficulty is added orthogonally via addColorDifficulty
// selfLeft (even userId): circle majority = self, square majority = other
var base_overlap_selfLeft_core = [
  // easy only
  { dot_shape_ratio: 0.59, dot_shape: "circle", difficulty: "easy", association: "self",
    coherent_direction: 0, coherence: 0, correct_value: "self", task_type: "overlap", data_part: "RDK_overlap" },
  { dot_shape_ratio: 0.59, dot_shape: "square", difficulty: "easy", association: "other",
    coherent_direction: 0, coherence: 0, correct_value: "other", task_type: "overlap", data_part: "RDK_overlap" }
];
var base_overlap_selfLeft = addColorDifficulty(base_overlap_selfLeft_core);

// selfRight (odd userId): square majority = self, circle majority = other
var base_overlap_selfRight_core = [
  // easy only
  { dot_shape_ratio: 0.59, dot_shape: "square", difficulty: "easy", association: "self",
    coherent_direction: 0, coherence: 0, correct_value: "self", task_type: "overlap", data_part: "RDK_overlap" },
  { dot_shape_ratio: 0.59, dot_shape: "circle", difficulty: "easy", association: "other",
    coherent_direction: 0, coherence: 0, correct_value: "other", task_type: "overlap", data_part: "RDK_overlap" }
];
var base_overlap_selfRight = addColorDifficulty(base_overlap_selfRight_core);

var conditions_overlap_selfLeft = generateDiscriminationConditions(base_overlap_selfLeft, {
  "self": ["我", "他"],
  "other": ["他", "我"]
});

var conditions_overlap_selfRight = generateDiscriminationConditions(base_overlap_selfRight, {
  "self": ["我", "他"],
  "other": ["他", "我"]
});

// The main stimulus

// The color-discrimination task reuses the unified RDK_discrimination stimulus (F/J keys + on-screen labels)
var RDK_color = RDK_discrimination;

// Practice phase

var practiceSet_color_selfLeft = createPracticeSet(conditions_color_selfLeft, 8);
var practice_block_color_selfLeft = {
  timeline: [
    instruction_color_beginning,
    instruction_color,
    {
      timeline: [fixation, RDK_color, feedbackTrial],
      timeline_variables: practiceSet_color_selfLeft,
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

var practiceSet_color_selfRight = createPracticeSet(conditions_color_selfRight, 8);
var practice_block_color_selfRight = {
  timeline: [
    instruction_color_beginning,
    instruction_color,
    {
      timeline: [fixation, RDK_color, feedbackTrial],
      timeline_variables: practiceSet_color_selfRight,
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

var practice_color_selfLeft = {
  timeline: [practice_block_color_selfLeft],
  conditional_function: function(){
    if (userId % 2 === 0) {
      console.log("practice_selfLeft");
      return true;
    } else {
      return false;
    }
  }
};

var practice_color_selfRight = {
  timeline: [practice_block_color_selfRight],
  conditional_function: function(){
    if (userId % 2 !== 0) {
      console.log("practice_selfRight");
      return true;
    } else {
      return false;
    }
  }
};


var practice_block_color = { 
  timeline: [practice_color_selfLeft, practice_color_selfRight]
};

var formal_block_color_selfLeft = {
  timeline: [
    instruction_color,
    // Block 1
    {
      timeline: [fixation, RDK_color],
      timeline_variables: conditions_color_selfLeft,
      repetitions: 8,
      randomize_order: true
    },
    feedbackBlock_RDK,
    rest_rdk,
    // Block 2
    {
      timeline: [fixation, RDK_color],
      timeline_variables: conditions_color_selfLeft,
      repetitions: 8,
      randomize_order: true
    },
    feedbackBlock_RDK,
  ],
};

var formal_block_color_selfRight = {
  timeline: [
    instruction_color,
    // Block 1
    {
      timeline: [fixation, RDK_color],
      timeline_variables: conditions_color_selfRight,
      repetitions: 8,
      randomize_order: true
    },
    feedbackBlock_RDK,
    rest_rdk,
    // Block 2
    {
      timeline: [fixation, RDK_color],
      timeline_variables: conditions_color_selfRight,
      repetitions: 8,
      randomize_order: true
    },
    feedbackBlock_RDK,
  ],
};

// The conditional assignments below are somewhat redundant and may be optimized later

// Decide whether to run the selfLeft or the selfRight version from the participant ID
var formal_color_selfLeft = {
  timeline: [formal_block_color_selfLeft],
  conditional_function: function(){
    if (userId % 2 === 0) {
      console.log("formal_color_selfLeft");
      return true;
    } else {
      return false;
    }
  }
};

var formal_color_selfRight = {
  timeline: [formal_block_color_selfRight],
  conditional_function: function(){
    if (userId % 2 !== 0) {
      console.log("formal_color_selfRight");
      return true;
    } else {
      return false;
    }
  }
};


var formal_block_color= { 
  timeline: [formal_color_selfLeft, formal_color_selfRight]
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
          <p>大多数点为<span style="font-weight: bold">圆形</span>代表<span style="font-weight: bold">你自己</span>，为<span style="font-weight: bold">正方形</span>代表<span style="font-weight: bold">他人</span>。</p >
          <p>您需要判断散点图代表的是<span style="font-weight: bold">您自己</span>还是<span style="font-weight: bold">他人</span></p>
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
          <p>大多数点为<span style="font-weight: bold">正方形</span>代表<span style="font-weight: bold">你自己</span>，为<span style="font-weight: bold">圆形</span>代表<span style="font-weight: bold">他人</span>。</p >
          <p>您需要判断散点图代表的是<span style="font-weight: bold">您自己</span>还是<span style="font-weight: bold">他人</span></p>
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
var practiceSet_overlap_selfLeft = createPracticeSet(conditions_overlap_selfLeft, 8);
var practice_block_overlap_selfLeft = {
  timeline: [
    instruction_overlap,
    instruction_RDK_practice,
    {
      timeline: [fixation, RDK_discrimination, feedbackTrial],
      timeline_variables: practiceSet_overlap_selfLeft,
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

var practiceSet_overlap_selfRight = createPracticeSet(conditions_overlap_selfRight, 8);
var practice_block_overlap_selfRight = {
  timeline: [
    instruction_overlap,
    instruction_RDK_practice,
    {
      timeline: [fixation, RDK_discrimination, feedbackTrial],
      timeline_variables: practiceSet_overlap_selfRight,
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

var practice_overlap_selfLeft = {
  timeline: [practice_block_overlap_selfLeft],
  conditional_function: function () {
    return (userId % 2 === 0);
  }
};

var practice_overlap_selfRight = {
  timeline: [practice_block_overlap_selfRight],
  conditional_function: function () {
    return (userId % 2 !== 0);
  }
};

var practice_block_overlap = {
  timeline: [practice_overlap_selfLeft, practice_overlap_selfRight]
};

// Formal phase
var formal_block_overlap_selfLeft = {
  timeline: [
    instruction_RDK_formal_beginning,
    // Block 1
    {
      timeline: [fixation, RDK_discrimination],
      timeline_variables: conditions_overlap_selfLeft,
      repetitions: 8,
      randomize_order: true
    },
    feedbackBlock_RDK,
    rest_rdk,
    // Block 2
    {
      timeline: [fixation, RDK_discrimination],
      timeline_variables: conditions_overlap_selfLeft,
      repetitions: 8,
      randomize_order: true
    },
    feedbackBlock_RDK,
  ],
};

var formal_block_overlap_selfRight = {
  timeline: [
    instruction_RDK_formal_beginning,
    // Block 1
    {
      timeline: [fixation, RDK_discrimination],
      timeline_variables: conditions_overlap_selfRight,
      repetitions: 8,
      randomize_order: true
    },
    feedbackBlock_RDK,
    rest_rdk,
    // Block 2
    {
      timeline: [fixation, RDK_discrimination],
      timeline_variables: conditions_overlap_selfRight,
      repetitions: 8,
      randomize_order: true
    },
    feedbackBlock_RDK,
  ],
};

var formal_overlap_selfLeft = {
  timeline: [formal_block_overlap_selfLeft],
  conditional_function: function () {
    return (userId % 2 === 0);
  }
};

var formal_overlap_selfRight = {
  timeline: [formal_block_overlap_selfRight],
  conditional_function: function () {
    return (userId % 2 !== 0);
  }
};

var formal_block_overlap = {
  timeline: [formal_overlap_selfLeft, formal_overlap_selfRight]
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

shape.timeline.push(block_RDK);

// over