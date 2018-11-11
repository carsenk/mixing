function isValid(address) {
	var startSpace = 0, endSpace = 0;
	if (address == '') {return true;}
	if (onlySpaces(address) == true) {return true;}
	for (var i = 0; i < address.length; i++) {
		if (address[i] == ' ') {startSpace++} else {break;}
	}
	for (var i = address.length-1; i >= 0; i--) {
		if (address[i] == ' ') {endSpace++} else {break;}
	}
	address = address.substring(startSpace, address.length-endSpace);
	if (!TESTNET) {
		if (address[0] != "1" && address[0] != "3") {
			return isBech32Valid(address);
		}	
		var hexAddress = base58decode(address);
		if (hexAddress) {
			var checkSum = hexAddress.substring(42);
			var binAddress = hexToBin(hexAddress.substring(0,42));
			var hash = sha256(sha256(binAddress, "bin"), "hex");		
			if (checkSum == hash.substring(0,8)) {return true;} else {return false;}
		} else {
			return false;
		}
	} else {
		if (address[0] != "m" && address[0] != "n" && address[0] != "2") {
			return isBech32Valid(address);
		}	
		var hexAddress = base58decode(address);
		if (hexAddress) {
			var checkSum = hexAddress.substring(42);
			var binAddress = hexToBin(hexAddress.substring(0,42));
			var hash = sha256(sha256(binAddress, "bin"), "hex");		
			if (checkSum == hash.substring(0,8)) {return true;} else {return false;}
		} else {
			return false;
		}
	}

	function polymod(values) {
		var GENERATOR = [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3];
	    var chk = 1;
	    for (var p = 0; p < values.length; ++p) {
	        var top = chk >> 25;
	        chk = (chk & 0x1ffffff) << 5 ^ values[p];
	        for (var i = 0; i < 5; ++i) {
	          if ((top >> i) & 1) {
	              chk ^= GENERATOR[i];
	          }
	        }
	    }
	    return chk;
	}
	
	function hrpExpand(hrp) {
	    var ret = [];
	    var p;
	    for (p = 0; p < hrp.length; ++p) {
	        ret.push(hrp.charCodeAt(p) >> 5);
	    }
	    ret.push(0);
	    for (p = 0; p < hrp.length; ++p) {
	        ret.push(hrp.charCodeAt(p) & 31);
	    }
	    return ret;
	}
	
	function verifyChecksum(hrp, data) {
	    return polymod(hrpExpand(hrp).concat(data)) === 1;
	}
	
	function isBech32Valid(bechString) {
	    var dict = ["00000",
	                "00001",
	                "00010",
	                "00011",
	                "00100",
	                "00101",
				    "00110",
				    "00111",
				    "01000",
	                "01001",
	                "01010",
	                "01011",
	                "01100",
	                "01101",
	                "01110",
	                "01111",
	                "10000",
	                "10001",
	                "10010",
	                "10011",
	                "10100",
	                "10101",
	                "10110",
	                "10111",
	                "11000",
	                "11001",
	                "11010",
	                "11011",
	                "11100",
	                "11101",
	                "11110",
	                "11111"];
	
	    var decodedInfo = decode(bechString);
	    if (decodedInfo === false) {
	    	return false;
	    }
	    var hrp  = decodedInfo.hrp,
	        data = decodedInfo.data;
	  
	    if (TESTNET) {
	    	if (hrp != "tb") {
	    		return false;
	    	}
	    } else {
	    	if (hrp != "bc") {
	    		return false;
	    	}
	    }
	    if (data.length == 0) {
	    	return false;
	    }
	    if (data[0] < 0 || data[0] > 16) {
	    	return false;
	    }

	    var bits = "";
 
	    for (var i = 1; i < data.length; i++) {
	    	bits += dict[data[i]];
	    }
	    rem = bits.length%8;
	    if (rem > 4) {
	    	return false;
	    }
	    if (rem > 0) {
	    	for (i = 0; i < rem; i++) {
	    	    if (bits[bits.length - 1 - i] != "0") {
	    	  	    return false;
	    	    }
	    	}
	    }
	    if ((bits.length-rem)/8 < 2 || (bits.length-rem)/8 > 40) {
	    	return false;
	    }
	    if (data[0] == 0) {
	    	if ((bits.length-rem)/8 !== 20 && (bits.length-rem)/8 !== 32) {
	    	    return false;
	    	}
	    }
	    return true;
	
	    function decode (bechString) {
	        var p;
	        var has_lower = false;
	        var has_upper = false;
	        var CHARSET = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l';
	        for (p = 0; p < bechString.length; ++p) {
	            if (bechString.charCodeAt(p) < 33 || bechString.charCodeAt(p) > 126) {
	                return false;
	            }
	            if (bechString.charCodeAt(p) >= 97 && bechString.charCodeAt(p) <= 122) {
	                has_lower = false;
	            }
	            if (bechString.charCodeAt(p) >= 65 && bechString.charCodeAt(p) <= 90) {
	                has_upper = false;
	            }
	        }
	        if (has_lower && has_upper) {
	            return false;
	        }
	        bechString = bechString.toLowerCase();
	        var pos = bechString.lastIndexOf('1');
	        if (pos < 1 || pos + 7 > bechString.length || bechString.length > 90) {
	            return false;
	        }
	        var hrp = bechString.substring(0, pos);
	        var data = [];
	        for (p = pos + 1; p < bechString.length; ++p) {
	            var d = CHARSET.indexOf(bechString.charAt(p));
	            if (d === -1) {
	                return false;
	            }
	            data.push(d);
	        }
	        if (!verifyChecksum(hrp, data)) {
	            return false;
	        }
	        return {hrp: hrp, data: data.slice(0, data.length - 6)};
	    }  
	}

	function onlySpaces(str) {
		for (var i = 0; i < str.length; i++) {
			if (str[i] != ' ') {return false;}
		}
		return true;
	}

	function base58decode(str) {
		var alphabet = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz",
		       str10 = "0";
		for (var i = str.length - 1; i>=0; i--) {
			if (alphabet.indexOf(str[i]) < 0) {return false;}
			str10 = long_addition(str10, long_multiplication(long_power("58", str.length-1-i), alphabet.indexOf(str[i]).toString()));
		}
		var str16 = long_toHex(str10);
		if (str16.length > 50) {return false;}
		str16 = '0'.repeat(50-str16.length) + str16;
		return str16;
	}

	function hexToBin(strHex) {
		var translation = {"0": "0000", "1": "0001", "2": "0010", "3": "0011",
						   "4": "0100", "5": "0101", "6": "0110", "7": "0111",
						   "8": "1000", "9": "1001", "A": "1010", "B": "1011",
						   "C": "1100", "D": "1101", "E": "1110", "F": "1111"};
		var strBin = '';
		for (var i = 0; i< strHex.length; i++) {
			strBin += translation[strHex[i]];
		}
		return strBin;
	}

	function sha256(strBin, outputType /*bin or hex only*/) {
		var h0 = "01101010000010011110011001100111",
			h1 = "10111011011001111010111010000101",
			h2 = "00111100011011101111001101110010",
			h3 = "10100101010011111111010100111010",
			h4 = "01010001000011100101001001111111",
			h5 = "10011011000001010110100010001100",
			h6 = "00011111100000111101100110101011",
			h7 = "01011011111000001100110100011001";

		
		var k  = ["01000010100010100010111110011000", "01110001001101110100010010010001", "10110101110000001111101111001111",
			      "11101001101101011101101110100101", "00111001010101101100001001011011", "01011001111100010001000111110001",
			      "10010010001111111000001010100100", "10101011000111000101111011010101", "11011000000001111010101010011000",
			      "00010010100000110101101100000001", "00100100001100011000010110111110", "01010101000011000111110111000011",
			      "01110010101111100101110101110100", "10000000110111101011000111111110", "10011011110111000000011010100111",
			      "11000001100110111111000101110100", "11100100100110110110100111000001", "11101111101111100100011110000110",
			      "00001111110000011001110111000110", "00100100000011001010000111001100", "00101101111010010010110001101111",
			      "01001010011101001000010010101010", "01011100101100001010100111011100", "01110110111110011000100011011010",
			      "10011000001111100101000101010010", "10101000001100011100011001101101", "10110000000000110010011111001000",
			      "10111111010110010111111111000111", "11000110111000000000101111110011", "11010101101001111001000101000111",
			      "00000110110010100110001101010001", "00010100001010010010100101100111", "00100111101101110000101010000101",
			      "00101110000110110010000100111000", "01001101001011000110110111111100", "01010011001110000000110100010011",
			      "01100101000010100111001101010100", "01110110011010100000101010111011", "10000001110000101100100100101110",
			      "10010010011100100010110010000101", "10100010101111111110100010100001", "10101000000110100110011001001011",
			      "11000010010010111000101101110000", "11000111011011000101000110100011", "11010001100100101110100000011001",
			      "11010110100110010000011000100100", "11110100000011100011010110000101", "00010000011010101010000001110000",
			      "00011001101001001100000100010110", "00011110001101110110110000001000", "00100111010010000111011101001100",
			      "00110100101100001011110010110101", "00111001000111000000110010110011", "01001110110110001010101001001010",
			      "01011011100111001100101001001111", "01101000001011100110111111110011", "01110100100011111000001011101110",
			      "01111000101001010110001101101111", "10000100110010000111100000010100", "10001100110001110000001000001000",
			      "10010000101111101111111111111010", "10100100010100000110110011101011", "10111110111110011010001111110111",
			      "11000110011100010111100011110010"];

		var L  = '0'.repeat(64-strBin.length.toString(2).length) + strBin.length.toString(2);
		strBin = strBin + "1"; 
		if ((strBin.length%512) <= 448) {
			strBin += '0'.repeat(448-(strBin.length%512));
		} else {
			strBin += '0'.repeat(960-(strBin.length%512));
		}
		strBin = strBin + L;
		
		var w = new Array(64).fill(0);

		var a = '', b = '',
			c = '', d = '',
			e = '', f = '',
			g = '',	h = '';

		var S0    = '', S1    = '', 
		    CH    = '', MAJ   = '', 
		 	temp1 = '', temp2 = '';

		for (var i=0; i<strBin.length/512; i++) {
			for (var j=0; j<16; j++) {
				w[j] = strBin.substring(32*j, 32*(j+1));
			}
			for (j=16; j<64; j++) {
		        w[j] = add32(add32(add32(w[j-16], s0(w[j-15])), w[j-7]), s1(w[j-2]));
	    	}
	    	//console.log(w);
	    	a = h0; b = h1; c = h2; d = h3; e = h4; f = h5; g = h6; h = h7;
	    	for (j=0; j<64; j++) {
	    		S1 = Sigma1(e);
	    		CH = ch(e,f,g);
	    		temp1 = add32(add32(add32(add32(h, S1), CH), k[j]), w[j]);
	    		S0 = Sigma0(a);
	    		MAJ = maj(a,b,c);
	    		temp2 = add32(S0, MAJ);

	    		h = g; g = f;
		        f = e; e = add32(d, temp1);
		        d = c; c = b;
		        b = a; a = add32(temp1, temp2)
	    	}

	    	h0 = add32(h0, a); h1 = add32(h1, b);
		    h2 = add32(h2, c); h3 = add32(h3, d);
		    h4 = add32(h4, e); h5 = add32(h5, f);
		    h6 = add32(h6, g); h7 = add32(h7, h);
		}
		var binHash = h0 + h1 + h2 + h3 + h4 + h5 + h6 + h7;
		if (outputType == "bin") {
			return binHash;
		} 
		if (outputType == "hex") {
			return hashToHex(binHash);
		}
		return "Unknown type of hash";

		function hashToHex(h) {
			var translation = {"0000": "0", "0001": "1", "0010": "2", "0011": "3",
							   "0100": "4", "0101": "5", "0110": "6", "0111": "7",
							   "1000": "8", "1001": "9", "1010": "A", "1011": "B",
							   "1100": "C", "1101": "D", "1110": "E", "1111": "F"};
			var hash = '';
			for (var i = 0; i<h.length/4; i++) {
				hash = hash + translation[h.substring(4*i,4*(i+1))];
			}
			return hash;
		}

		function s0(x) {
			return xor(xor(rightrotate(x,7), rightrotate(x,18)), rightshift(x, 3));
		}

		function s1(x) {
			return xor(xor(rightrotate(x,17), rightrotate(x,19)), rightshift(x, 10));
		}

		function Sigma0(x) {
			return xor(xor(rightrotate(x, 2), rightrotate(x, 13)), rightrotate(x, 22));
		}

		function Sigma1(x) {
			return xor(xor(rightrotate(x, 6), rightrotate(x, 11)), rightrotate(x, 25));
		}	

		function ch(x,y,z) {
			return xor(and(x, y), and(not(x), z));
		}

		function maj(x,y,z) {
			return xor(xor(and(x,y), and(x,z)), and(y,z));
		}

		function rightrotate(x,n) {
			n = n%x.length;
			return x.substring(x.length-n) + x.substring(0, x.length-n);
		}

		function rightshift(x,n) {
			if (x.length > n) {
				return '0'.repeat(n) + x.substring(0, x.length-n);
			} else {
				return '0'.repeat(x.length);
			}
		}

		function xor(x,y) {
			var z = '';
			for (var i = x.length-1; i>=0; i--) {
				z = ((x[i]*1+y[i]*1)%2) + z;
			}
			return z;
		}

		function not(x) {
			var z = '';
			for (var i = 0; i<x.length; i++) {
				z = z + (1+x[i]*1)%2;
			}
			return z;
		}

		function and(x,y) {
			var z = '';
			for (var i = x.length-1; i>=0; i--) {
				z = ((x[i]*y[i])) + z;
			}
			return z;
		}

		function add32(x,y) {
			var upLim = Math.pow(2,32);
			var sum = ((parseInt(x,2)+parseInt(y,2))%upLim).toString(2);
			sum = '0'.repeat(32-sum.length) + sum;
			return sum;
		}
	}
}

