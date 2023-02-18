let canvasSize;

let overlayImg;
let overlaySize;
let overlayEnabled = false;

let bones = {};
let joints = {};

let JointInfoLabel;
let offsetSliders = {};
let boneWidthSlider;
let jointDiamaterSlider;

let mirrorCenterJoint = "upperChest";

let jointDef = poses["default"];

let boneDef = {
  "rWrist": ["rWrist", "rElbow", "#999900"],
  "rElbow": ["rElbow", "rShoulder", "#996600"],
  "rShoulder": ["rShoulder", "upperChest", "#990000"],
  "rHip": ["rHip", "upperChest", "#009900"],
  "rKnee": ["rKnee", "rHip", "#009933"],
  "rAnkle": ["rAnkle", "rKnee", "#009966"],
  "lWrist": ["lWrist", "lElbow", "#339900"],
  "lElbow": ["lElbow", "lShoulder", "#669900"],
  "lShoulder": ["lShoulder", "upperChest", "#993300"],
  "lHip": ["lHip", "upperChest", "#009999"],
  "lKnee": ["lKnee", "lHip", "#006699"],
  "lAnkle": ["lAnkle", "lKnee", "#003399"],
  "upperChest": ["upperChest", "nose", "#000099"],
  "rHeadInner": ["rHeadInner", "nose", "#330099"],
  "rHeadOuter": ["rHeadOuter", "rHeadInner", "#660099"],
  "lHeadInner": ["lHeadInner", "nose", "#990099"],
  "lHeadOuter": ["lHeadOuter", "lHeadInner", "#990066"]
}

function setup() {
  canvasSize = {
    x: document.getElementById("iwidth").value,
    y: document.getElementById("iheight").value
  }

  createCanvas(canvasSize.x, canvasSize.y);

  Joint.offset = {x: 0, y: 0, z: 0};

  for (let joint in jointDef) {
    let j = jointDef[joint];
    joints[joint] = new Joint(j[0], j[1], j[2]);
    joints[joint].x += canvasSize.x/2;
    joints[joint].y += canvasSize.y/2;
  }

  for (let bone in boneDef) {
    let b = boneDef[bone];
    bones[bone] = new Bone(joints[b[0]], joints[b[1]], b[2]);
  }

  Joint.mirrorCenterJoint = joints[mirrorCenterJoint];
  for (let joint in jointDef) {
    let mirrorJoint = jointDef[joint][3];
    if (mirrorJoint) {
      joints[joint].mirrorJoint = joints[mirrorJoint];
    }
  }

  resetUI();
}

function draw() {
  background(0);
  
  if (overlayImg && overlayEnabled) {
    let x = (canvasSize.x - overlaySize.x) / 2;
    let y = (canvasSize.y - overlaySize.y) / 2;
    tint(255, 127);
    image(overlayImg, x, y, overlaySize.x, overlaySize.y);
  }

  for (let bone in bones) {
    bones[bone].show();
  }

  JointInfoLabel.textContent = "<hover over joint>";
  for (let joint in joints) {
    let j = joints[joint];
    j.update();
    j.show();
    if (j.isOver()) {
      JointInfoLabel.textContent = joint;
    }
  }
}

function mousePressed() {
  for (let joint in joints) {
    joints[joint].pressed();
  }
}

function mouseReleased() {
  for (let joint in joints) {
    joints[joint].released();
  }
}

function resizeCanv() {
  let pose = getPose(true);
  canvasSize = {
    x: document.getElementById("iwidth").value,
    y: document.getElementById("iheight").value
  }
  resizeCanvas(canvasSize.x, canvasSize.y);
  resetOffset();
  setPose(pose);
  let ratio = Math.min(canvasSize.x / overlayImg.width, canvasSize.y / overlayImg.height);
  overlaySize = { x: overlayImg.width*ratio, y: overlayImg.height*ratio };
}

function resetPose() {
  resetOffset();
  setPose(jointDef);
}

function loadOverlay(event) {
  let reader = new FileReader();
  reader.onload = function() {
    overlayImg = loadImage(reader.result);
    overlayEnabled = false;
    setTimeout(() => {
      let ratio = Math.min(canvasSize.x / overlayImg.width, canvasSize.y / overlayImg.height);
      overlaySize = { x: overlayImg.width*ratio, y: overlayImg.height*ratio };
      overlayEnabled = true;
    }, "500")
  }
  reader.readAsDataURL(event.target.files[0]);
}

function toggleOverlay() {
  overlayEnabled = !overlayEnabled;
}

function round1d(value) {
  return Math.round(value * 10) / 10;
}

function getPose(raw=false, color=false, formatted=false) {
  let pose = {};
  for (let jointName in joints) {
      let joint = joints[jointName];
      let dim = { x: canvasSize.x/2, y: canvasSize.y/2};
      if (color)
        pose[jointName] = [round1d(joint.x-dim.x), round1d(joint.y-dim.y), jointDef[jointName][2]];
      else
        pose[jointName] = [round1d(joint.x-dim.x), round1d(joint.y-dim.y)];
  }
  if (raw) return pose;
  if (formatted) return JSON.stringify(pose, null, 2);
  return JSON.stringify(pose);
}

function exportPose() {
  let pose = getPose(true);
  let out = "";
  let i = 0;
  for (joint in pose) {
    if (i % 2 == 0) out += '\n';
    out += `"${joint}": [${pose[joint][0]}, ${pose[joint][1]}], `;
    i++;
  }
  out = "{" + out.substring(1, out.length-2) + "}";
  let e = document.getElementById("pose-json");
  e.value = out;
}

function importPose() {
  let e = document.getElementById("pose-json");
  let pose = JSON.parse(e.value);
  setPose(pose);
  e.value = "";
}

function setPose(pose) {
  let dim = { x: canvasSize.x/2, y: canvasSize.y/2};
  for (joint in pose) {
    joints[joint].x = pose[joint][0] + dim.x;
    joints[joint].y = pose[joint][1] + dim.y;
  }
}

function resetUI() {
  JointInfoLabel = document.getElementById("hover-info");
  offsetSliders.x = document.getElementById("offsetX");
  offsetSliders.y = document.getElementById("offsetY");
  offsetSliders.z = document.getElementById("offsetZ");
  boneWidthSlider = document.getElementById("bone-width");
  jointDiamaterSlider = document.getElementById("joint-diameter");

  offsetSliders.x.min = -canvasSize.x;
  offsetSliders.x.max = canvasSize.x;
  offsetSliders.x.value = 0;
  offsetSliders.y.min = -canvasSize.y;
  offsetSliders.y.max = canvasSize.y;
  offsetSliders.y.value = 0;
  offsetSliders.z.min = -5;
  offsetSliders.z.max = 5;
  offsetSliders.z.value = 0;
  offsetSliders.z.step = 0.1;

  boneWidthSlider.value = 8;
  jointDiamaterSlider.value = 8;

  boneWidthChanged();
  jointDiamaterChanged();

  document.getElementById('radio-ellipse').checked = true;
  setBoneStyle('ellipse');
}

function offsetChanged() {
  Joint.offset.x = offsetSliders.x.value*1;
  Joint.offset.y = offsetSliders.y.value*-1;
  Joint.offset.z = offsetSliders.z.value*1;
}

function setBoneStyle(value) {
  Bone.style = value;
}

function boneWidthChanged() {
  Bone.width = boneWidthSlider.value*1;
}

function jointDiamaterChanged() {
  Joint.diameter = jointDiamaterSlider.value*1;
}

function resetOffset() {
  offsetSliders.x.value = 0;
  offsetSliders.y.value = 0;
  offsetSliders.z.value = 0;
  offsetChanged();
}

function resetBoneJointSize() {
  boneWidthSlider.value = 8;
  jointDiamaterSlider.value = 8;
  boneWidthChanged();
  jointDiamaterChanged();
}

function mirrorJointsChanged(axis) {
  if (axis == "h") {
    let e = document.getElementById("mirror-joints-h");
    Joint.mirrorH = e.checked;
  }
  else if (axis == "v") {
    let e = document.getElementById("mirror-joints-v");
    Joint.mirrorV = e.checked;
  }
}

function poseSelected() {
  let e = document.getElementById("pose-presets");
  jointDef = poses[e.value];
  resetPose();
}