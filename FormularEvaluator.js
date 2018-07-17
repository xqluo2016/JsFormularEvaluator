var FormularEvaluator = {};

FormularEvaluator.input = function(s) {
	return {
		s : s,
		p : -1,
		get : function() {
			var p = this.p;
			var s = this.s;
			if (p < s.length && p >= 0) {
				return s[p];
			} else {
				return null;
			}
		},
		hasNext : function() {
			return this.p < this.s.length - 1;
		},
		next : function() {
			var s = this.s, p = this.p;
			if (p < s.length - 1) {
				return s[p + 1];
			} else {
				return null;
			}
		},
		move : function() {
			this.p++;
		}

	};
};

FormularEvaluator.popExecute = function(ts, ops, program) {
	while (ts.length > 0) {
		var token = ts.pop();
		var tcode = token.code;
		if (ops.indexOf(tcode) < 0) {
			ts.push(token);
			break;
		}

		if ('+' == tcode) {
			program.push({
				exe : function(vs) {
					var v2 = vs.pop();
					var v1 = vs.pop();
					vs.push(v1 + v2);
				}
			});
		} else if ('-' == tcode) {
			program.push({
				exe : function(vs) {
					var v2 = vs.pop();
					var v1 = vs.pop();
					vs.push(v1 - v2);
				}
			});
		} else if ('N' == tcode) {
			program.push({
				exe : function(vs) {
					var v1 = vs.pop();
					vs.push(-v1);
				}
			});
		}else if ('*' == tcode) {
			program.push({
				exe : function(vs) {
					var v2 = vs.pop();
					var v1 = vs.pop();
					vs.push(v1 * v2);
				}
			});
		} else if ('/' == tcode) {
			program.push({
				exe : function(vs) {
					var v2 = vs.pop();
					var v1 = vs.pop();
					vs.push(v1 / v2);
				}
			});
		} else if ('%' == tcode) {
			program.push({
				exe : function(vs) {
					var v2 = vs.pop();
					var v1 = vs.pop();
					vs.push(v1 % v2);
				}
			});
		} else if ('C' == tcode) {
			var v = 1.0 * token.str;
			program.push({
				arg : v,
				exe : function(vs) {
					vs.push(this.arg);
				}
			});
		} else if ('I' == tcode) {
			var str = token.str;
			program.push({
				arg : str,
				exe : function(vs, vars) {
					var s = this.arg;
					if ('e' == s) {
						vs.push(Math.E);
					} else if ('pi' == s) {
						vs.push(Math.PI);
					} else {
						var v1 = vars[s]
						vs.push(v1);
					}
				}
			});
		} else if ('=' == tcode) {
			var str = ts.pop().str;
			program.push({
				arg : str,
				exe : function(vs, vars) {
					var v1 = vs.pop();
					vars[this.arg] = v1;
				}
			});
		} else if ('(' == tcode) {
			throw 'Unclosed bracket';
		} else if (',' == tcode) {

		} else if (')' == tcode) {
			FormularEvaluator.popExecute(ts, '+-*/%ICNP),', program);

			var lb = ts.pop();
			if (lb == null || lb.code != '(') {
				throw 'No start bracket';
			}
			var func = ts.pop();
			if (func != null) {
				if (func.code != 'I') {
					ts.push(func);
				} else {
					var fname = func.str;
					if ('sin' == fname) {
						program.push({
							exe : function(vs, vars) {
								var v1 = vs.pop();
								vs.push(Math.sin(v1));
							}
						});
					} else if ('cos' == fname) {
						program.push({
							exe : function(vs, vars) {
								var v1 = vs.pop();
								vs.push(Math.cos(v1));
							}
						});
          } else if ('tan' == fname) {
            program.push({
              exe: function (vs, vars) {
                var v1 = vs.pop();
                vs.push(Math.tan(v1));
              }
            });
          } else if ('atan' == fname) {
            program.push({
              exe: function (vs, vars) {
                var v1 = vs.pop();
                vs.push(Math.atan(v1));
              }
            });
          } else if ('pow' == fname) {
						program.push({
							exe : function(vs, vars) {
								var v2 = vs.pop();
								var v1 = vs.pop();
								vs.push(Math.pow(v1, v2));
							}
						});
					} else if ('max' == fname) {
						program.push({
							exe : function(vs, vars) {
								var v2 = vs.pop();
								var v1 = vs.pop();
								vs.push(Math.max(v1, v2));
							}
						});
					} else if ('min' == fname) {
						program.push({
							exe : function(vs, vars) {
								var v2 = vs.pop();
								var v1 = vs.pop();
								vs.push(Math.min(v1, v2));
							}
						});
					}else if ('log' == fname) {
						program.push({
							exe : function(vs, vars) {
								var v1 = vs.pop();
								vs.push(Math.log10(v1));
							}
						});
					} else if ('ln' == fname) {
						program.push({
							exe : function(vs, vars) {
								var v1 = vs.pop();
								vs.push(Math.log(v1));
							}
						});
					} else if ('exp' == fname) {
						program.push({
							exe : function(vs, vars) {
								var v1 = vs.pop();
								vs.push(Math.exp(v1));
							}
						});
					} else if ('abs' == fname) {
						program.push({
							exe : function(vs, vars) {
								var v1 = vs.pop();
								vs.push(Math.abs(v1));
							}
						});
          } else if ('sig' == fname) {
            program.push({
              exe: function (vs, vars) {
                var v1 = vs.pop();
                vs.push(1/(1+Math.pow(Math.E,-v1)));
              }
            });
          }
				}

			}

		}
	}
};

FormularEvaluator.acceptors = [
		{
			code : 'I',
			name : 'ID',
			accept : function(input, ts, program) {
				var c = input.next();
				var str = '';
				while (c != null && c >= 'a' && c <= 'z') {
					str += c;
					input.move();
					c = input.next();
				}
				if (str != '') {
					// =+-*/%()ICPN,
					if (ts.length > 0) {
						var prev = ts[ts.length - 1];
						var pcode = prev.code;
						if (')' == pcode || 'I' == pcode || 'C' == pcode) {
							throw 'unexpected token "' + str + '"@' + input.p
									+ '->' + input.s;
						}
					}
					// FormularEvaluator.popExecute(ts,'');
					ts.push({
						code : 'I',
						str : str
					});
					return true;
				} else {
					return false;
				}
			}
		},
		{
			code : 'C',
			name : 'CONST',
			accept : function(input, ts, program) {
				var c = input.next();
				var str = '';
				while (c != null && c >= '0' && c <= '9') {
					str += c;
					input.move();
					c = input.next();
				}
				if (c != null && c == '.') {
					str += c;
					input.move();
					c = input.next();

					while (c != null && c >= '0' && c <= '9') {
						str += c;
						input.move();
						c = input.next();
					}
				}

				if (str != '') {
					// =+-*/%()ICPN,
					if (ts.length > 0) {
						var prev = ts[ts.length - 1];
						var pcode = prev.code;
						if (')' == pcode || 'I' == pcode || 'C' == pcode) {
							throw 'unexpected token "' + str + '"@' + input.p
									+ '->' + input.s;
						}
					}
					ts.push({
						code : 'C',
						str : str
					});
					return true;
				} else {
					return false;
				}
			}
		},
		{
			code : '+',
			name : 'ADD',
			accept : function(input, ts, program) {
				var c = input.next();
				var str = '';
				if (c != null && c == '+') {
					str = c;
					input.move();
					c = input.next();
					// =+-*/%()ICPN
					if (ts.length > 0) {
						var prev = ts[ts.length - 1];
						var pcode = prev.code;
						if ('+' == pcode || '-' == pcode || '*' == pcode
								|| '/' == pcode || '(' == pcode || '=' == pcode) {
							// ignore postive sign
							return;
						} else if ('P' == pcode || 'N' == pcode || ',' == pcode) {
							throw 'unexpected token "' + str + '"@' + input.p
									+ '->' + input.s;
						} else {
							FormularEvaluator.popExecute(ts, '+-*/%)ICPN', program);
						}
					}
					ts.push({
						code : '+',
						str : str
					});
					return true;
				} else {
					return false;
				}
			}
		},
		{
			code : '-',
			name : 'SUB',
			accept : function(input, ts, program) {
				var c = input.next();
				var str = '';
				if (c != null && c == '-') {
					str = c;
					input.move();
					c = input.next();

					// =+-*/%()ICPN
					if (ts.length > 0) {
						var prev = ts[ts.length - 1];
						var pcode = prev.code;
						if ('+' == pcode || '-' == pcode || '*' == pcode
								|| '/' == pcode || '(' == pcode || '=' == pcode) {
							ts.push({
								code : 'N',
								str : str
							});
							return;
						} else if ('P' == pcode || 'N' == pcode || ',' == pcode) {
							throw 'unexpected token "' + str + '"@' + input.p
									+ '->' + input.s;
						}
					}
					FormularEvaluator.popExecute(ts, '+-*/%)ICPN', program);
					ts.push({
						code : '-',
						str : str
					});
					return true;
				} else {
					return false;
				}
			}
		},
		{
			code : '*',
			name : 'MUL',
			accept : function(input, ts, program) {
				var c = input.next();
				var str = '';
				if (c != null && c == '*') {
					str = c;
					input.move();
					c = input.next();

					// =+-*/%()ICPN
					if (ts.length > 0) {
						var prev = ts[ts.length - 1];
						var pcode = prev.code;
						if ('I' != pcode && 'C' != pcode && ')' != pcode) {
							throw 'unexpected token "' + str + '"@' + input.p
									+ '->' + input.s;
						} else {
							FormularEvaluator.popExecute(ts, '*/%)ICPN', program);
						}
					}
					ts.push({
						code : '*',
						str : str
					});
					return true;
				} else {
					return false;
				}
			}
		},
		{
			code : '/',
			name : 'DIV',
			accept : function(input, ts, program) {
				var c = input.next();
				var str = '';
				if (c != null && c == '/') {
					str = c;
					input.move();
					c = input.next();

					// =+-*/%()ICPN
					if (ts.length > 0) {
						var prev = ts[ts.length - 1];
						var pcode = prev.code;
						if ('I' != pcode && 'C' != pcode && ')' != pcode) {
							throw 'unexpected token "' + str + '"@' + input.p
									+ '->' + input.s;
						} else {
							FormularEvaluator.popExecute(ts, '*/%)ICPN', program);
						}
					}
					ts.push({
						code : '/',
						str : str
					});
					return true;
				} else {
					return false;
				}
			}
		},
		{
			code : '％',
			name : 'MOD',
			accept : function(input, ts, program) {
				var c = input.next();
				var str = '';
				if (c != null && c == '%') {
					str = c;
					input.move();
					c = input.next();

					// =+-*/%()ICPN
					if (ts.length > 0) {
						var prev = ts[ts.length - 1];
						var pcode = prev.code;
						if ('I' != pcode && 'C' != pcode && ')' != pcode) {
							throw 'unexpected token "' + str + '"@' + input.p
									+ '->' + input.s;
						} else {
							FormularEvaluator.popExecute(ts, '*/%)ICPN', program);
						}
					}
					ts.push({
						code : '%',
						str : str
					});
					return true;
				} else {
					return false;
				}
			}
		},
		{
			code : '=',
			name : 'ASS',
			accept : function(input, ts, program) {
				var c = input.next();
				var str = '';
				if (c != null && c == '=') {
					str = c;
					input.move();
					c = input.next();

					// =+-*/%()ICPN
					if (ts.length > 0) {
						var prev = ts[ts.length - 1];
						var pcode = prev.code;
						if ('I' != pcode) {
							throw 'unexpected token "' + str + '"@' + input.p
									+ '->' + input.s;
						}
					} else {
						throw 'unexpected token "' + str + '"@' + input.p
								+ '->' + input.s;
					}
					ts.push({
						code : '=',
						str : str
					});
					return true;
				} else {
					return false;
				}
			}
		},
		{
			code : '(',
			name : 'LB',
			accept : function(input, ts, program) {
				var c = input.next();
				var str = '';
				if (c != null && c == '(') {
					str = c;
					input.move();
					c = input.next();

					// =+-*/%()ICPN
					if (ts.length > 0) {
						var prev = ts[ts.length - 1];
						var pcode = prev.code;
						if (')' == pcode || 'C' == pcode) {
							throw 'unexpected token "' + str + '"@' + input.p
									+ '->' + input.s;
						}
					}
					ts.push({
						code : '(',
						str : str
					});
					return true;
				} else {
					return false;
				}
			}
		},
		{
			code : ')',
			name : 'RB',
			accept : function(input, ts, program) {
				var c = input.next();
				var str = '';
				if (c != null && c == ')') {
					str = c;
					input.move();
					c = input.next();

					// =+-*/%()ICPN
					if (ts.length > 0) {
						var prev = ts[ts.length - 1];
						var pcode = prev.code;
						if (')' == pcode || 'I' == pcode || 'C' == pcode) {
						} else {
							throw 'unexpected token "' + str + '"@' + input.p
									+ '->' + input.s;
						}
					}
					ts.push({
						code : ')',
						str : str
					});
					return true;
				} else {
					return false;
				}
			}
		},
		{
			code : ',',
			name : 'COM',
			accept : function(input, ts, program) {
				var c = input.next();
				var str = '';
				if (c != null && c == ',') {
					str = c;
					input.move();
					c = input.next();

					// =+-*/%()ICPN
					if (ts.length > 0) {
						var prev = ts[ts.length - 1];
						var pcode = prev.code;
						if (')' == pcode || 'I' == pcode || 'C' == pcode) {
						} else {
							throw 'unexpected token "' + str + '"@' + input.p
									+ '->' + input.s;
						}
					}
					FormularEvaluator.popExecute(ts, '+-*/%)ICPN', program);
					ts.push({
						code : ',',
						str : str
					});
					return true;
				} else {
					return false;
				}
			}
		},
		{
			code : ';',
			name : 'SEP',
			accept : function(input, ts, program) {
				var c = input.next();
				var str = '';
				if (c != null && c == ';') {
					str = c;
					input.move();
					c = input.next();

					// =+-*/%()ICPN
					if (ts.length > 0) {
						var prev = ts[ts.length - 1];
						var pcode = prev.code;
						if (')' == pcode || 'I' == pcode || 'C' == pcode) {
						} else {
							throw 'unexpected token "' + str + '"@' + input.p
									+ '->' + input.s;
						}
					}
					FormularEvaluator.popExecute(ts, '=+-*/%)ICPN', program);

					return true;
				} else {
					return false;
				}
			}
		} ];

FormularEvaluator.compile = function(s) {
	s = s.replace(/[^0-9a-z\.=\+\-\*\/\(\)%,;]/g, '');

	var program = [];
	var accs = FormularEvaluator.acceptors;
	var len = accs.length;

	var input = FormularEvaluator.input(s);
	var ts = [];

	while (input.hasNext()) {
		var p = input.p;
		for (var i = 0; i < len; i++) {
			var acc = accs[i];
			acc.accept(input, ts, program);
		}
		if (p == input.p) {
			throw 'Not able to consume: ' + p + "@" + input.s;
		}
	}
	if (ts.length > 0) {
		var code = ts[ts.length - 1].code;
		if (')IC'.indexOf(code) < 0) {
			console.log(ts);
			throw ts;
		}
		FormularEvaluator.popExecute(ts, '=+-*/%()ICPN', program);
	}

	return {
		vars : {},
		vs : [],
		prog : program,
		run : function(arg) {
			if (arg != null) {
				this.vars = arg
			}
			var vs = this.vs;
			var vars = this.vars;
			var prog = this.prog;
			for (var i = 0; i < prog.length; i++) {
				var p = prog[i];
				p.exe(vs, vars);
			}
			return vars;
		}
	};
}
