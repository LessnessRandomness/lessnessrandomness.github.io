/*
The MIT License (MIT)

Copyright (c) 2017 Nicole White

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/

/* taken from https://github.com/nicolewhite/algebra.js/blob/master/build/algebra-0.2.6.js */

// MathML class

BigInt.prototype.toJSON = function() {
    return this.toString();
};

var textNode = function(x) {
    return document.createTextNode(x.toString());
};

class MathML {
	constructor(tag, content = [], attributes = {}){
		var n = document.createElementNS("http://www.w3.org/1998/Math/MathML", tag);
		var i;
		if (Array.isArray(content)) {
			for (i = 0; i < content.length; i++) {
				n.appendChild(content[i]);
			}
		} else {
			n.appendChild(content);
		}
		for (i in attributes) {
			n.setAttribute(i, attributes[i]);
		}
		return n;
	}
	static row(content) {
		return (new MathML("mrow", content));
	}
	static done(content, block = false) {
		var t;
		var attributes = {
			"xmlns": "http://www.w3.org/1998/Math/MathML"
		};
		if (block) {
			attributes.display = "block";
		}
		if (Array.isArray(content)) {
			if (content.length === 0) {
				throw ("Empty MathML formula");
			}
			if (content.length === 1) {
				t = new MathML("mrow", content[0]);
				return (new MathML("math", t, attributes));
			}
			if (content.length > 1) {
				var f = (x) => new MathML("mtr", new MathML("mtd", x));
				t = new MathML("mtable", content.map(f), {"columnalign": "left", "linebreak": "true"});
				return (new MathML("math", t, attributes));
			}
        } else {
			return (new MathML("math", new MathML("mrow", content), attributes));
        }		
	}
}

BigInt.prototype.toMathML = function() {
	if (this >= 0n) {
		return (new MathML("mn", textNode(this)));
	} else {
		var mn = new MathML("mn", textNode(-this));
		var mo = new MathML("mo", textNode("-"));
		return MathML.row([mo, mn]);
	}
};

// Fraction class

function gcd(x, y) {
    while (y !== 0n) {
        var temp = x;
        x = y;
        y = temp % y;
    }
    return x;
}

function lcm(x, y) {
    return (x * y) / gcd(x, y);
}

class Fraction {
	constructor(a, b = 1n) {
		a = BigInt(a);
		b = BigInt(b);
		if (b === 0n) {
			throw new EvalError("Divide By Zero");
		} else {
			this.numer = a;
			this.denom = b;
		}
		return this;
	}
	copy() {
		return new Fraction(this.numer, this.denom);
	}
	reduce() {
		var copy = this.copy();
		var g = gcd(copy.numer, copy.denom);
		copy.numer = copy.numer / g;
		copy.denom = copy.denom / g;
		if (copy.denom < 0n && copy.numer > 0n) {
			copy.numer = -copy.numer;
			copy.denom = -copy.denom;
		}
		return copy;
	}
	equalTo(fraction) {
		if (fraction instanceof Fraction) {
			var thisReduced = this.reduce();
			var thatReduced = fraction.reduce();
			return thisReduced.numer === thatReduced.numer && thisReduced.denom === thatReduced.denom;
		} else {
			return false;
		}
	}
	add(f, simplify = true) {
		var a, b;
		if (f instanceof Fraction) {
			a = f.numer;
			b = f.denom;
		} else {
			a = f;
			b = 1;
		}
		var copy = this.copy();
		if (this.denom == b) {
			copy.numer += a;
		} else {
			var m = lcm(copy.denom, b);
			var thisM = m / copy.denom;
			var otherM = m / b;
			copy.numer *= thisM;
			copy.denom *= thisM;
			a *= otherM;
			copy.numer += a;
		}
		return (simplify ? copy.reduce() : copy);
	}
	substract(f, simplify = true) {
		var copy = this.copy();
		if (f instanceof Fraction) {
			return copy.add(new Fraction(-f.numer, f.denom), simplify);
		} else {
			return copy.add(new Fraction(-f, 1), simplify);
		};
	}
	multiply(f, simplify = true) {
		var a, b;
		if (f instanceof Fraction) {
			a = f.numer;
			b = f.denom;
		} else {
			a = f;
			b = 1n;
		};
		var copy = this.copy();
		copy.numer *= a;
		copy.denom *= b;
		return (simplify ? copy.reduce() : copy);
	}
	divide(f, simplify = true) {
		if (f.numer === 0n) {
			throw new EvalError("Divide By Zero");
		}
		var copy = this.copy();
		if (f instanceof Fraction) {
			return copy.multiply(new Fraction(f.denom, f.numer), simplify);
		} else {
			return copy.multiply(new Fraction(1, f), simplify);
		}
	}
	pow(n, simplify = true) {
		var copy = this.copy();
		if (simplify) {
			copy = copy.reduce();
		};
		copy.numer = copy.numer ** n;
		copy.denom = copy.denom ** n;
		return copy;
	}
	abs() {
		var copy = this.copy();
		if (copy.numer < 0n)
			copy.numer = -copy.numer;
		if (copy.denom < 0n)
			copy.denom = -copy.denom;
		return copy;
	}
	toMathML() {
		if (this.numer === 0n) {
			return [new MathML("mn", textNode(0n))];
		} else if (this.denom === 1n && this.numer > 0n) {
			return [new MathML("mn", textNode(this.numer))];
		} else if (this.denom === 1n && this.numer < 0n) {
			return [new MathML("mo", textNode("-")), new MathML("mn", textNode(-this.numer))];
		} else if (this.numer > 0n) {
			var a = new MathML("mo", textNode(this.numer));
			var b = new MathML("mo", textNode(this.denom));
			return [new MathML("mfrac", [a, b])];
		} else {
			var a = new MathML("mo", textNode(-this.numer));
			var b = new MathML("mo", textNode(this.denom));
			var f = new MathML("mfrac", [a, b]);
			var m = new MathML("mo", textNode("-"));
			return [m, f];
		}
	}
};

// Variable class

class Variable {
	constructor(variable, degree = 1n) {
		this.variable = variable;
		this.degree = degree;
	}
	copy() {
		return (new Variable(this.variable, this.degree));
	}
	static defaultVariables(v) {
		var variable = v.variable;
		var degree = v.degree;
		if (degree === 1n) {
			var a = new MathML("mi", textNode("x"));
			var i = new MathML("mn", textNode(variable));
			return (new MathML("msub", [a, i]));
		} else {
			var a = new MathML("mi", textNode("x"));
			var n = new MathML("mn", textNode(variable));
			var i = new MathML("mn", textNode(degree));
			return (new MathML("msubsup", [a, n, i]));
		}
	}
	toMathML(namingScheme = Variable.defaultVariables) {
		if (this.degree === 0n) {
			return undefined;
		};
		return namingScheme(this);
	}
}

// Term class

class Term {
	constructor(variable) {
		if (typeof(variable) === "undefined") {
			this.variables = [];
		} else if (variable instanceof Variable) {
			this.variables = [variable.copy()];
		} else {
			throw new TypeError("Invalid Argument (" + variable.toString() + "): Term initializer must be of type Variable.");
		}
		this.coefficients = [new Fraction(1n)];
	}
	coefficient() {
		//calculate the product of all coefficients
		return this.coefficients.reduce(function(p,c){return p.multiply(c);}, new Fraction(1n));
	}
	copy() {
		var copy = new Term();
		copy.coefficients = this.coefficients.map(function(c){return c.copy();});
		copy.variables = this.variables.map(function(v){return v;});
		return copy;
	}
	combineVars() {
		var uniqueVars = {};
		for (var i = 0; i < this.variables.length; i++) {
			var thisVar = this.variables[i];
			if (thisVar.variable in uniqueVars) {
				uniqueVars[thisVar.variable] += thisVar.degree;
			} else {
				uniqueVars[thisVar.variable] = thisVar.degree;
			}
		}
		var newVars = [];
		for (var v in uniqueVars) {
			var newVar = new Variable(v, uniqueVars[v])
			newVars.push(newVar);
		}
		this.variables = newVars;
		return this;
	}
	simplify() {
		var copy = this.copy();
		copy.coefficients = [this.coefficient()];
		copy.combineVars();
		return copy;
	}
	canBeCombinedWith(term) {
		var thisVars = this.variables;
		var thatVars = term.variables;
		if (thisVars.length != thatVars.length) {
			return false;
		}
		var matches = 0;
		for (var i = 0; i < thisVars.length; i++) {
			for (var j = 0; j < thatVars.length; j++) {
				if (thisVars[i].variable === thatVars[j].variable && thisVars[i].degree === thatVars[j].degree) {
					matches += 1;
				}
			}
		}
		return (matches === thisVars.length);
	}
	add(term) {
		if (term instanceof Term && this.canBeCombinedWith(term)) {
			var copy = this.copy();
			copy.coefficients = [copy.coefficient().add(term.coefficient())];
			return copy;
		} else {
			throw new TypeError("Invalid Argument (" + term.toString() + "): Summand must be of type Term.");
		}
	}
	substract(term) {
		if (term instanceof Term && this.canBeCombinedWith(term)) {
			var copy = this.copy();
			copy.coefficients = [copy.coefficient().substract(term.coefficient())];
			return copy;
		} else {
			throw new TypeError("Invalid Argument (" + term.toString() + "): Subtrahend must be of type Term.");
		}
	}
	multiply(a, simplify = true) {
		var thisTerm = this.copy();
		if (a instanceof Term) {
			thisTerm.variables = thisTerm.variables.concat(a.variables);
			thisTerm.coefficients = thisTerm.coefficients.concat(a.coefficients);
		} else if (a instanceof Fraction || typeof(a) === "bigint") {
			var newCoef = (typeof(a) === "bigint" ? new Fraction(a) : a);
			if (thisTerm.variables.length === 0) {
				thisTerm.coefficients.push(newCoef);
			} else {
				thisTerm.coefficients.unshift(newCoef);
			}
		} else {
			throw new TypeError("Invalid Argument (" + a.toString() + "): Multiplicand must be of type Term, Fraction or BigInt.");
		}
		return (simplify ? thisTerm.simplify() : thisTerm);
	}
	divide(a, simplify = true) {
		if (a instanceof Fraction || typeof(a) === "bigint") {
			var thisTerm = this.copy()
			thisTerm.coefficients = thisTerm.coefficients.map(function(c){return c.divide(a, simplify);});
			return thisTerm;
		} else {
			throw new TypeError("Invalid Argument (" + a.toString() + "): Argument must be of type Fraction or BigInt.");
		}
	}
	hasVariable(variable) {
		for (var i = 0; i < this.variables.length; i++) {
			if (this.variables[i].variable === variable) {
				return true;
			}
		}
		return false;
	}
	maxDegree() {
		return this.variables.reduce(function(p,c){if (p < c.degree) return c.degree; else return p;}, 1n);
	}
	/*
	maxDegreeOfVariable(variable) {
		return this.variables.reduce(function(p,c){return (c.variable === variable) ? ((p < c.degree) ? c.degree : p) : p;},1);
	}
	onlyHasVariable(variable) {
		for (var i = 0; i < this.variables.length; i++) {
			if (this.variables[i].variable != variable) {
				return false;
			}
		}
		return true;
	} */
	toMathML() {
		var copy = this.copy().simplify();
		var coef = copy.coefficient();
		var m = [];
		if (coef.abs().numer !== 1n || coef.abs().denom !== 1n) {
			m = coef.toMathML();
		}
		m = this.variables.reduce(function(p,c){return p.concat(c.toMathML());}, m);
		return m;
	}
}

class Expression {
	constructor(variable) {
		this.constants = [];
		if (variable instanceof Variable) {
			var t = new Term(variable);
			this.terms = [t];
		} else if (typeof(variable) === "bigint") {
			this.constants = [new Fraction(variable)];
			this.terms = [];
		} else if (variable instanceof Fraction) {
			this.constants = [variable];
			this.terms = [];
		} else if (variable instanceof Term) {
			this.terms = [variable];
		} else if (typeof(variable) === "undefined") {
			this.terms = [];
		} else {
			throw new TypeError("Invalid Argument (" + variable.toString() + "): Argument must be of type Variable, BigInt, Fraction or Term.");
		}
	}
	copy() {
		var copy = new Expression();
		copy.constants = this.constants.map(function(c){return c.copy();});
		copy.terms = this.terms.map(function(t){return t.copy();});
	    return copy;
	}
	constant() {
		return this.constants.reduce(function(p,c){return p.add(c);}, new Fraction(0n));
	}
	removeTermsWithCoefficientZero() {
		this.terms = this.terms.filter(function(t){return t.coefficient().reduce().numer !== 0n;});
		return this;
	}
	combineLikeTerms() {
		function alreadyEncountered(term, encountered) {
			for (var i = 0; i < encountered.length; i++) {
				if (term.canBeCombinedWith(encountered[i])) {
					return true;
				}
			}
			return false;
		}
		var newTerms = [];
		var encountered = [];
		for (var i = 0; i < this.terms.length; i++) {
			var thisTerm = this.terms[i];
			if (alreadyEncountered(thisTerm, encountered)) {
				continue;
			} else {
				for (var j = i + 1; j < this.terms.length; j++) {
					var thatTerm = this.terms[j];
					if (thisTerm.canBeCombinedWith(thatTerm)) {
						thisTerm = thisTerm.add(thatTerm);
					}
				}
				newTerms.push(thisTerm);
				encountered.push(thisTerm);
			}
		}
		this.terms = newTerms;
		return this;
	}
	moveTermsWithDegreeZeroToConstants() {
		var keepTerms = [];
		var constant = new Fraction(0n);
		for (var i = 0; i < this.terms.length; i++) {
			var thisTerm = this.terms[i];
			if (thisTerm.variables.length === 0) {
				constant = constant.add(thisTerm.coefficient());
			} else {
				keepTerms.push(thisTerm);
			}
		}
		this.constants.push(constant);
		this.terms = keepTerms;
		return this;
	}
	sort() {
		function sortTerms(a, b) {
			var x = a.maxDegree();
			var y = b.maxDegree();
			if (x === y) {
				var m = a.variables.length;
				var n = b.variables.length;
				return (n - m);
			} else {
				return (y - x);
			}
		}
		this.terms = this.terms.sort(sortTerms);
		return this;
	}
	simplify() {
		var copy = this.copy();
		copy.terms = copy.terms.map(function(t){return t.simplify();});
		copy.sort();
		copy.combineLikeTerms();
		copy.moveTermsWithDegreeZeroToConstants();
		copy.removeTermsWithCoefficientZero();
		copy.constants = (copy.constant().numer === 0n ? [] : [copy.constant()]);
		return copy;
	}
	add(a, simplify = true) {
		var thisExp = this.copy();
		if (a instanceof Variable || a instanceof Term || typeof(a) === "bigint" || a instanceof Fraction) {
			var exp = new Expression(a);
			return thisExp.add(exp, simplify);
		} else if (a instanceof Expression) {
			var keepTerms = a.copy().terms;
			thisExp.terms = thisExp.terms.concat(keepTerms);
			thisExp.constants = thisExp.constants.concat(a.constants);
			thisExp.sort();
		} else {
			throw new TypeError("Invalid Argument (" + a.toString() + "): Summand must be of type Variable, Expression, Term, Fraction or BigInt.");
		}
		return (simplify) ? thisExp.simplify() : thisExp;
	}
	subtract(a, simplify = true) {
		var negative = (a instanceof Expression) ? a.multiply(-1n) : new Expression(a).multiply(-1n);
		return this.add(negative, simplify);
	}
	multiply(a, simplify = true) {
		var thisExp = this.copy();
	    if (a instanceof Variable || a instanceof Term || typeof(a) === "bigint" || a instanceof Fraction) {
			var exp = new Expression(a);
			return thisExp.multiply(exp, simplify);
		} else if (a instanceof Expression) {
			var thatExp = a.copy();
			var newTerms = [];
			for (var i = 0; i < thisExp.terms.length; i++) {
				var thisTerm = thisExp.terms[i];
				for (var j = 0; j < thatExp.terms.length; j++) {
					var thatTerm = thatExp.terms[j];
					newTerms.push(thisTerm.multiply(thatTerm, simplify));
				}
				for (var j = 0; j < thatExp.constants.length; j++) {
					newTerms.push(thisTerm.multiply(thatExp.constants[j], simplify));
				}
			}
			for (var i = 0; i < thatExp.terms.length; i++) {
				var thatTerm = thatExp.terms[i];
				for (var j = 0; j < thisExp.constants.length; j++) {
					newTerms.push(thatTerm.multiply(thisExp.constants[j], simplify));
				}
			}
			var newConstants = [];
			for (var i = 0; i < thisExp.constants.length; i++) {
				var thisConst = thisExp.constants[i];
				for (var j = 0; j < thatExp.constants.length; j++) {
					var thatConst = thatExp.constants[j];
					var t = new Term();
					t = t.multiply(thatConst, false);
					t = t.multiply(thisConst, false);
					newTerms.push(t);
				}
			}
			thisExp.constants = newConstants;
			thisExp.terms = newTerms;
			thisExp.sort();
		} else {
			throw new TypeError("Invalid Argument (" + a.toString() + "): Multiplicand must be of type Variable, Expression, Term, Fraction or BigInt.");
		}
		return (simplify) ? thisExp.simplify() : thisExp;
	}
	divide(a, simplify = true) {
		if (a instanceof Fraction || typeof(a) === "bigint") {
			if (a instanceof Fraction) {
				if (a.numer === 0n) {
					throw new EvalError("Divide By Zero");
				}
			}
			if (typeof(a) === "bigint") {
				if (a === 0n) {
					throw new EvalError("Divide By Zero");
				}
			}
			var copy = this.copy();
			for (var i = 0; i < copy.terms.length; i++) {
				var thisTerm = copy.terms[i];
				for (var j = 0; j < thisTerm.coefficients.length; j++) {
					thisTerm.coefficients[j] = thisTerm.coefficients[j].divide(a, simplify);
				}
			}
			copy.constants = copy.constants.map(function(c){return c.divide(a,simplify);});
			return copy;
		} else {
			throw new TypeError("Invalid Argument (" + a.toString() + "): Divisor must be of type Fraction or BigInt.");
		}
	}
	pow(a, simplify = true) {
		if (typeof(a) === "bigint") {
			var copy = this.copy();
			if (a === 0n) {
				return new Expression().add(1);
			} else {
				for (var i = 1n; i < a; i++) {
					copy = copy.multiply(this, simplify);
				}
				copy.sort();
			}
			return (simplify) ? copy.simplify() : copy;
		} else {
			throw new TypeError("Invalid Argument (" + a.toString() + "): Exponent must be of type BigInt.");
		}
	}
	toMathML() {
		var m = [];
		var b = false;
		for (var i = 0; i < this.terms.length; i++) {
			var term = this.terms[i];
			if (b) {
				if (term.coefficients[0].numer < 0n) {
					m.push(new MathML("mo", textNode("-")));
					term = term.multiply(-1n);
				} else {
					m.push(new MathML("mo", textNode("+")));
				}
			} else {
				b = true;
				if (term.coefficients[0].numer < 0n) {
					m.push(new MathML("mo", textNode("-")));
					term = term.multiply(-1n);
				}	
			}
			m = m.concat(term.toMathML());
		}
		for (var i = 0; i < this.constants.length; i++) {
			var constant = this.constants[i];
			if (b) {
				if (constant.numer < 0n) {
					m.push(new MathML("mo", textNode("-")));
					constant = constant.multiply(-1n);
				} else {
					m.push(new MathML("mo", textNode("-")));
				}
			} else {
				b = true;
				if (constant.numer < 0n) {
					m.push(new MathML("mo", textNode("-")));
					constant = constant.multiply(-1n);
				}
			}
			m = m.concat(constant.abs().toMathML());
		}
		if (m.length === 0) {
			return (new MathML("mn", textNode("0")));
		}
		return m;
	}
}
