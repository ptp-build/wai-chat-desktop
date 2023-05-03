import { runPyCode } from '../utils/evalPython';

async function sendCode() {
  //const sendPath = await checkTempFile('send.png');
  await runPyCode(`
import pyautogui
import time
#pyautogui.moveTo(347, 710)
pyautogui.click()
pyautogui.moveTo(907, 675)
pyautogui.click()
`);
}
async function getPosition() {
  const res = await runPyCode(`
import pyautogui
import os
x, y = pyautogui.position()
content = f'{x}, {y}'
print(content)
`);
  console.log(res);
  return res;
}
