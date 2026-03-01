let activeTab = 'vigenere';
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

    function cleanText(text) {
      return text.toUpperCase().replace(/[^A-Z]/g, '');
    }

    function switchTab(tab) {
      activeTab = tab;
      
      // Update Desktop Nav
      document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('bg-indigo-900');
        btn.classList.add('hover:bg-indigo-600');
      });
      document.getElementById('tab-' + tab).classList.add('bg-indigo-900');
      document.getElementById('tab-' + tab).classList.remove('hover:bg-indigo-600');

      // Update Mobile Nav
      document.querySelectorAll('.mob-btn').forEach(btn => {
        btn.classList.remove('bg-white', 'text-indigo-900');
        btn.classList.add('bg-indigo-700');
      });
      document.getElementById('mob-' + tab).classList.add('bg-white', 'text-indigo-900');
      document.getElementById('mob-' + tab).classList.remove('bg-indigo-700');

      // Update Title
      document.getElementById('cipher-title').innerText = tab.charAt(0).toUpperCase() + tab.slice(1) + ' Cipher';

      // Switch Settings Group
      document.querySelectorAll('.settings-group').forEach(el => el.classList.add('hidden'));
      if (tab === 'vigenere' || tab === 'playfair') {
        document.getElementById('keyword-container').classList.remove('hidden');
      } else if (tab === 'affine') {
        document.getElementById('affine-container').classList.remove('hidden');
      } else if (tab === 'hill') {
        document.getElementById('hill-container').classList.remove('hidden');
      } else if (tab === 'enigma') {
        document.getElementById('enigma-container').classList.remove('hidden');
      }

      // Reset Output
      document.getElementById('output-container').classList.add('hidden');
      document.getElementById('empty-state').classList.remove('hidden');
      document.getElementById('output-text').innerText = '';
    }

    // --- LOGIC FUNCTIONS ---
    function vigenere(text, key, encrypt = true) {
      const input = cleanText(text);
      const k = cleanText(key);
      if (!k) return "Masukkan Kunci";
      let result = "";
      for (let i = 0; i < input.length; i++) {
        const p = alphabet.indexOf(input[i]);
        const shift = alphabet.indexOf(k[i % k.length]);
        const c = encrypt ? (p + shift) % 26 : (p - shift + 26) % 26;
        result += alphabet[c];
      }
      return result;
    }

    function gcd(a, b) {
      return b === 0 ? a : gcd(b, a % b);
    }

    function modInverse(a, m) {
      for (let x = 1; x < m; x++) if (((a % m) * (x % m)) % m === 1) return x;
      return 1;
    }

    function affine(text, a, b, encrypt = true) {
      const input = cleanText(text);
      if (gcd(a, 26) !== 1) return "Nilai 'A' harus koprim dengan 26";
      let result = "";
      for (let i = 0; i < input.length; i++) {
        const x = alphabet.indexOf(input[i]);
        if (encrypt) {
          result += alphabet[(a * x + b) % 26];
        } else {
          const invA = modInverse(a, 26);
          result += alphabet[(invA * (x - b + 26)) % 26];
        }
      }
      return result;
    }

    function playfair(text, key, encrypt = true) {
      let k = cleanText(key).replace(/J/g, 'I');
      let matrix = [];
      let used = new Set();
      for (let char of k) {
        if (!used.has(char)) {
          matrix.push(char);
          used.add(char);
        }
      }
      for (let char of alphabet) {
        if (char === 'J') continue;
        if (!used.has(char)) {
          matrix.push(char);
          used.add(char);
        }
      }

      let input = cleanText(text).replace(/J/g, 'I');
      let pairs = [];
      for (let i = 0; i < input.length; i += 2) {
        let a = input[i];
        let b = input[i + 1] || 'X';
        if (a === b) {
          pairs.push(a + 'X');
          i--;
        } else {
          pairs.push(a + b);
        }
      }

      let result = "";
      pairs.forEach(pair => {
        let idx1 = matrix.indexOf(pair[0]);
        let idx2 = matrix.indexOf(pair[1]);
        let r1 = Math.floor(idx1 / 5), c1 = idx1 % 5;
        let r2 = Math.floor(idx2 / 5), c2 = idx2 % 5;

        if (r1 === r2) {
          let shift = encrypt ? 1 : 4;
          result += matrix[r1 * 5 + (c1 + shift) % 5] + matrix[r2 * 5 + (c2 + shift) % 5];
        } else if (c1 === c2) {
          let shift = encrypt ? 1 : 4;
          result += matrix[((r1 + shift) % 5) * 5 + c1] + matrix[((r2 + shift) % 5) * 5 + c2];
        } else {
          result += matrix[r1 * 5 + c2] + matrix[r2 * 5 + c1];
        }
      });
      return result;
    }

    function hill(text, matrix, encrypt = true) {
      const input = cleanText(text);
      let paddedInput = input;
      if (paddedInput.length % 2 !== 0 && encrypt) paddedInput += 'X';
      
      let result = "";
      for (let i = 0; i < paddedInput.length; i += 2) {
        const x1 = alphabet.indexOf(paddedInput[i]);
        const x2 = alphabet.indexOf(paddedInput[i+1] || 'X');
        
        if (encrypt) {
          const y1 = (matrix[0][0] * x1 + matrix[0][1] * x2) % 26;
          const y2 = (matrix[1][0] * x1 + matrix[1][1] * x2) % 26;
          result += alphabet[y1] + alphabet[y2];
        } else {
          return "Fitur Dekripsi Hill memerlukan invers matriks modular.";
        }
      }
      return result;
    }

    function enigma(text, r1, r2, r3, encrypt = true) {
      const input = cleanText(text);
      const rotors = [
        "EKMFLGDQVZNTOWYHXUSPAIBRCJ",
        "AJDKSIRUXBLHWTMCQGZNPYFVOE",
        "BDFHJLCPDSXUSNYHBVTMQGZNPY"
      ];
      const reflector = "YRUHQSLDPXNGOKMIEBFZCWVJAT";

      let result = "";
      let curR1 = r1, curR2 = r2, curR3 = r3;

      for (let char of input) {
        let idx = alphabet.indexOf(char);
        
        curR3 = (curR3 + 1) % 26;
        if (curR3 === 0) {
          curR2 = (curR2 + 1) % 26;
          if (curR2 === 0) curR1 = (curR1 + 1) % 26;
        }

        idx = (alphabet.indexOf(rotors[2][(idx + curR3) % 26]) - curR3 + 26) % 26;
        idx = (alphabet.indexOf(rotors[1][(idx + curR2) % 26]) - curR2 + 26) % 26;
        idx = (alphabet.indexOf(rotors[0][(idx + curR1) % 26]) - curR1 + 26) % 26;

        idx = alphabet.indexOf(reflector[idx]);

        idx = (rotors[0].indexOf(alphabet[(idx + curR1) % 26]) - curR1 + 26) % 26;
        idx = (rotors[1].indexOf(alphabet[(idx + curR2) % 26]) - curR2 + 26) % 26;
        idx = (rotors[2].indexOf(alphabet[(idx + curR3) % 26]) - curR3 + 26) % 26;

        result += alphabet[idx];
      }
      return result;
    }

    function handleAction(isEncrypt) {
      const text = document.getElementById('input-text').value;
      if (!text) return;

      let res = "";
      if (activeTab === 'vigenere') {
        const key = document.getElementById('keyword-input').value;
        res = vigenere(text, key, isEncrypt);
      } else if (activeTab === 'playfair') {
        const key = document.getElementById('keyword-input').value;
        res = playfair(text, key, isEncrypt);
      } else if (activeTab === 'affine') {
        const a = parseInt(document.getElementById('affine-a').value) || 0;
        const b = parseInt(document.getElementById('affine-b').value) || 0;
        res = affine(text, a, b, isEncrypt);
      } else if (activeTab === 'hill') {
        const m00 = parseInt(document.getElementById('hill-00').value) || 0;
        const m01 = parseInt(document.getElementById('hill-01').value) || 0;
        const m10 = parseInt(document.getElementById('hill-10').value) || 0;
        const m11 = parseInt(document.getElementById('hill-11').value) || 0;
        res = hill(text, [[m00, m01], [m10, m11]], isEncrypt);
      } else if (activeTab === 'enigma') {
        const r1 = parseInt(document.getElementById('rotor-1').value) || 0;
        const r2 = parseInt(document.getElementById('rotor-2').value) || 0;
        const r3 = parseInt(document.getElementById('rotor-3').value) || 0;
        res = enigma(text, r1, r2, r3, isEncrypt);
      }

      document.getElementById('output-text').innerText = res;
      document.getElementById('output-container').classList.remove('hidden');
      document.getElementById('empty-state').classList.add('hidden');
    }

    function copyText() {
      const text = document.getElementById('output-text').innerText;
      const textArea = document.createElement("textarea");
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      textArea.remove();
    }