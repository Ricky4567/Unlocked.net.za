// src/utils/adblocker.js
import { Engine } from 'ad-block';
import fetch from 'node-fetch';

export async function loadFilters() {
  const response = await fetch('https://easylist.to/easylist/easylist.txt');
  const filtersText = await response.text();
  const engine = new Engine(filtersText.split('\n'));
  return engine;
}

export function blockAds(engine) {
  const elements = document.querySelectorAll('*');
  elements.forEach(element => {
    if (engine.match(element)) {
      element.style.display = 'none';
    }
  });
}
