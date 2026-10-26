import test from 'node:test';
import assert from 'node:assert/strict';
import { generateDistinctPins, generatePin, PIN_LENGTH } from '../src/lib/student-pin';
import { pinsToCsv } from '../src/lib/pin-csv';

test('a PIN is six digits including leading zeros, and a batch never repeats', () => {
  for (let i = 0; i < 200; i++) assert.match(generatePin(), new RegExp('^[0-9]{' + PIN_LENGTH + '}$'));
  const pins = generateDistinctPins(500);
  assert.equal(new Set(pins).size, 500); assert.ok(pins.every(pin => pin.length === PIN_LENGTH));
  assert.throws(() => generateDistinctPins(10 ** PIN_LENGTH), /Too many/);
});

test('the PIN list for printing opens in Excel with Vietnamese names and keeps leading zeros', () => {
  const csv = pinsToCsv([{ displayName: 'Nguyễn "Văn" An', pin: '004821' }]);
  assert.ok(csv.startsWith('\uFEFF')); assert.ok(csv.includes('"Nguyễn ""Văn"" An",="004821"'));
});
