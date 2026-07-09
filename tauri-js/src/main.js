import './style.css';
import { parseBetText, parseStandardBets, formatParsedBets } from './parser.js';
import { splitBets } from './splitter.js';

const $ = (id) => document.getElementById(id);

const els = {
  inputRaw: $('input-raw'),
  outputParse: $('output-parse'),
  outputSplit: $('output-split'),
  settingGroups: $('setting-groups'),
  settingMin: $('setting-min'),
  statusLog: $('status-log'),
  btnPaste: $('btn-paste'),
  btnMul5: $('btn-mul5'),
  btnMul10: $('btn-mul10'),
  btnSplit: $('btn-split'),
};

let currentParsedBets = [];
let currentStep = 10;

function appendLog(msg, type = 'info') {
  const entry = document.createElement('div');
  entry.className = `log-entry ${type}`;
  const time = new Date().toLocaleTimeString('zh-CN', { hour12: false });
  entry.textContent = `[${time}] ${msg}`;
  els.statusLog.appendChild(entry);
  els.statusLog.scrollTop = els.statusLog.scrollHeight;
}

function updateStepButtons() {
  els.btnMul5.classList.toggle('active', currentStep === 5);
  els.btnMul10.classList.toggle('active', currentStep === 10);
}

async function copyText(text, successMsg) {
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
    appendLog(successMsg, 'success');
  } catch (err) {
    appendLog('复制失败：' + err.message, 'error');
  }
}

async function handlePaste() {
  try {
    const text = await navigator.clipboard.readText();
    els.inputRaw.value = text;
    handleInputChange();
  } catch (err) {
    appendLog('粘贴失败：' + err.message, 'error');
  }
}

function handleParse() {
  try {
    const text = els.inputRaw.value;
    const parsed = parseBetText(text);
    currentParsedBets = parseStandardBets(parsed);
    els.outputParse.value = formatParsedBets(currentParsedBets, 5);
    appendLog(`已解析 ${currentParsedBets.length} 注`, 'success');
  } catch (err) {
    els.outputParse.value = '';
    currentParsedBets = [];
    appendLog(err.message, 'error');
  }
}

function doSplit(shouldCopy = false) {
  try {
    if (currentParsedBets.length === 0) {
      els.outputSplit.value = '';
      return;
    }

    const groups = parseInt(els.settingGroups.value, 10) || 1;
    const minAmount = parseInt(els.settingMin.value, 10) || 0;

    const lines = splitBets(currentParsedBets, groups, minAmount, currentStep);
    const resultText = lines.join('\n');
    els.outputSplit.value = resultText;

    if (shouldCopy) {
      copyText(resultText, '拆单完成并已复制');
    } else {
      appendLog('已自动拆单', 'info');
    }
  } catch (err) {
    els.outputSplit.value = '';
    appendLog(err.message, 'error');
  }
}

function handleInputChange() {
  handleParse();
  doSplit(false);
}

function handleSettingChange() {
  doSplit(false);
}

function applyStep(step) {
  if (currentStep === step) return;
  currentStep = step;
  updateStepButtons();
  doSplit(false);
  appendLog(`拆单步长 ${currentStep}`, 'info');
}

function handleSplitButton() {
  doSplit(true);
}

function bindEvents() {
  els.btnPaste.addEventListener('click', handlePaste);
  els.inputRaw.addEventListener('input', handleInputChange);
  els.settingGroups.addEventListener('input', handleSettingChange);
  els.settingMin.addEventListener('input', handleSettingChange);
  els.btnMul5.addEventListener('click', () => applyStep(5));
  els.btnMul10.addEventListener('click', () => applyStep(10));
  els.btnSplit.addEventListener('click', handleSplitButton);

  els.outputParse.addEventListener('click', () =>
    copyText(els.outputParse.value, '解析结果已复制')
  );
  els.outputSplit.addEventListener('click', () =>
    copyText(els.outputSplit.value, '拆单结果已复制')
  );
}

bindEvents();
updateStepButtons();

// 初始化：如果输入框已有内容，自动解析并拆单
if (els.inputRaw.value.trim()) {
  handleInputChange();
}
