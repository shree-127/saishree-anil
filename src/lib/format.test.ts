import test from "node:test";
import assert from "node:assert/strict";
import { getAddress, getArea } from "./format";

test("getAddress returns addressKn when language is kn and addressKn is populated", () => {
  const item = {
    address: "Silk Board Junction, Outer Ring Road, Bengaluru",
    addressKn: "ಸಿಲ್ಕ್ ಬೋರ್ಡ್ ಜಂಕ್ಷನ್, ಔಟರ್ ರಿಂಗ್ ರೋಡ್, ಬೆಂಗಳೂರು",
  };
  assert.equal(
    getAddress(item, "kn"),
    "ಸಿಲ್ಕ್ ಬೋರ್ಡ್ ಜಂಕ್ಷನ್, ಔಟರ್ ರಿಂಗ್ ರೋಡ್, ಬೆಂಗಳೂರು"
  );
  assert.equal(
    getAddress(item, "en"),
    "Silk Board Junction, Outer Ring Road, Bengaluru"
  );
});

test("getAddress falls back gracefully to English when addressKn is missing", () => {
  const item = {
    address: "MG Road, Bengaluru",
  };
  assert.equal(getAddress(item, "kn"), "MG Road, Bengaluru");
  assert.equal(getAddress(item, "en"), "MG Road, Bengaluru");
});

test("getArea returns areaKn when lang is kn and areaEn when lang is en", () => {
  const item = {
    address: "Marathahalli Bridge, Bengaluru",
    addressKn: "ಮಾರತ್ತಹಳ್ಳಿ ಸೇತುವೆ, ಬೆಂಗಳೂರು",
    areaEn: "Marathahalli",
    areaKn: "ಮಾರತ್ತಹಳ್ಳಿ",
  };
  assert.equal(getArea(item, "kn"), "ಮಾರತ್ತಹಳ್ಳಿ");
  assert.equal(getArea(item, "en"), "Marathahalli");
});

test("getArea falls back to address if area is not provided", () => {
  const item = {
    address: "Whitefield, Bengaluru",
    addressKn: "ವೈಟ್ಫೀಲ್ಡ್, ಬೆಂಗಳೂರು",
  };
  assert.equal(getArea(item, "kn"), "ವೈಟ್ಫೀಲ್ಡ್, ಬೆಂಗಳೂರು");
  assert.equal(getArea(item, "en"), "Whitefield, Bengaluru");
});
