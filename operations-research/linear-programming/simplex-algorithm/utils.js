/* jshint esversion: 11 */
"use strict";

var textNode = function(x) {
    return document.createTextNode(x.toString());
};

var MathML = {};

MathML.node = function(tag, content = [], attributes = {}) {
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
};

MathML.row = function(content) {
    return MathML.node("mrow", content);
};

MathML.done = function(content, block = false) {
    var math, t;
    var attributes = {
        "xmlns": "http://www.w3.org/1998/Math/MathML"
    };
    if (Array.isArray(content)) {
        if (content.length === 0) {
            throw ("Empty MathML formula");
        }
        if (block) {
            attributes.display = "block";
        }
        if (content.length === 1) {
            t = MathML.node("mrow", content[0]);
            return MathML.node("math", t, attributes);
        }
        if (content.length > 1) {
            var f = (x) => MathML.node("mtr", MathML.node("mtd", x));
            t = MathML.node("mtable", content.map(f), {"columnalign": "left", "linebreak": "true"});
            return MathML.node("math", t, attributes);
        }
    } else {
        return MathML.node("math", [MathML.node("mrow", content)], attributes);
    }
};

function greatestCommonDivisor(a, b) {
    if (a < 0n) {
        a = -a;
    }
    if (b < 0n) {
        b = -b;
    }
    while (b !== 0n) {
        var t = a;
        a = b;
        b = t % a;
    }
    return a;
}

function Fraction(numerator, denominator = 1) {
    numerator = BigInt(numerator);
    denominator = BigInt(denominator);
    if (denominator === 0n) {
        throw ("Division by zero");
    }
    var gcd = greatestCommonDivisor(numerator, denominator);
    numerator = numerator / gcd;
    denominator = denominator / gcd;
    if (denominator < 0n) {
        denominator = -denominator;
        numerator = -numerator;
    }
    var f = {};
    f.numerator = numerator;
    f.denominator = denominator;
    f.toMathML = function() {
        var mn, mo, minus, a, b, t;
		if (f.numerator === 0n) {
			return MathML.node("mn", textNode(0n));
		}
        if (f.denominator === 1n && f.numerator > 0n) {
            return MathML.node("mn", textNode(f.numerator));
        }
        if (f.denominator === 1n && f.numerator < 0n) {
            mn = MathML.node("mn", textNode(-f.numerator));
            mo = MathML.node("mo", textNode("-"));
            return [mo, mn];
        }
        if (f.denominator !== 1n && f.numerator > 0n) {
            a = MathML.node("mn", textNode(f.numerator));
            b = MathML.node("mn", textNode(f.denominator));
            return MathML.node("mfrac", [a, b]);
        }
        if (f.denominator !== 1n && f.numerator < 0n) {
            a = MathML.node("mn", textNode(-f.numerator));
            b = MathML.node("mn", textNode(f.denominator));
            minus = MathML.node("mo", textNode("-"));
            return [minus, MathML.node("mfrac", [a, b])];
        }
    };
    return f;
}

function simplifyFraction(f) {
    f = Fraction(f.numerator, f.denominator);
}

function oppositeFraction(f) {
    return Fraction(-f.numerator, f.denominator);
}

function defaultVariables(n) {
    var mi, mn, msub;
    mi = MathML.node("mi", textNode("x"));
    mn = MathML.node("mn", textNode(n + 1));
    return MathML.node("msub", [mi, mn]);
}

function LinearExpression(coefficients) {
    var t = {};
    t.coefficients = coefficients;
    t.toMathML = function() {
        var theFirst = -1;
        for (i = 0; i < t.coefficients.length; i++) {
            if (t.coefficients[i].numerator !== 0n) {
                theFirst = i;
                break;
            }
        }
        if (theFirst === -1)
            throw ("Linear expression equal to zero");
        var M = [];
        var temp = t.coefficients[theFirst];
        var mo, mn, minus, plus;
        if (temp.denominator === 1n) {
            if (temp.numerator === 1n) {
                M = M.concat(defaultVariables(theFirst));
            }
            if (temp.numerator === -1n) {
                minus = MathML.node("mo", textNode("-"));
                M.push(minus);
                M.push(defaultVariables(theFirst));
            }
            if (temp.numerator > 1n) {
                mn = MathML.node("mn", textNode(temp.numerator));
                M.push(mn);
                M.push(defaultVariables(theFirst));
            }
            if (temp.numerator < -1n) {
                minus = MathML.node("mo", [textNode("-")]);
                M.push(minus);
                mn = MathML.node("mn", textNode(-temp.numerator));
                M.push(mn);
                M.push(defaultVariables(theFirst));
            }
        } else {
            M = M.concat(temp.toMathML());
        }
        for (var i = theFirst + 1; i < t.coefficients.length; i++) {
            temp = t.coefficients[i];
            if (temp.numerator !== 0n) {
                if (temp.numerator > 0n) {
                    plus = MathML.node("mo", textNode("+"));
                    M.push(plus);
                    if (temp.numerator !== 1n || temp.denominator !== 1n) {
                        M = M.concat(temp.toMathML());
                    }
                    M.push(defaultVariables(i));
                } else {
                    minus = MathML.node("mo", textNode("-"));
                    M.push(minus);
                    if (temp.numerator !== -1n || temp.denominator !== 1n) {
                        M = M.concat(oppositeFraction(temp).toMathML());
                    }
                    M.push(defaultVariables(i));
                }
            }
        }
        return M;
    };
    return t;
}

function ObjectiveFunction(objectiveFunction, maximum = true) {
    var t = {};
    t.objectiveFunction = objectiveFunction;
    t.maximum = maximum;
    t.toMathML = function() {
        var math = t.objectiveFunction.toMathML();
        var arrow = MathML.node("mo", textNode("→"), {
            "stretchy": "false"
        });
        math.push(arrow);
        var mi;
        if (maximum) {
            mi = MathML.node("mi", textNode("max"));
        } else {
            mi = MathML.node("mi", textNode("min"));
        }
        math.push(mi);
        return math;
    };
    t.maxVariable = t.objectiveFunction.coefficients.length - 1;
    return t;
}

function LinearConstraint(expression, b, sign = "le") {
    var t = {};
    t.expression = expression;
    t.B = b;
    t.sign = sign;
    t.toMathML = function() {
        var math = t.expression.toMathML();
        var mo;
        if (sign === "le") {
            mo = MathML.node("mo", textNode("\u2264")); // &le;
        }
        if (sign === "eq") {
            mo = MathML.node("mo", textNode("="));
        }
        if (sign === "ge") {
            mo = MathML.node("mo", textNode("\u2265")); // &ge;
        }
        math.push(mo);
        math = math.concat(t.B.toMathML());
        return math;
    };
    t.maxVariable = t.expression.coefficients.length - 1;
    return t;
}

function LinearProgrammingProblem(objective, constraints, integerVariables = []) {
    var t = {};
    t.constraints = constraints;
    t.objective = objective;
    t.integerVariables = integerVariables;
    t.maxVariable = objective.maxVariable;
    for (var i = 0; i < t.constraints.length; i++) {
        if (t.constraints[i].length > t.maxVariable) {
            t.maxVariable = t.constraints[i].length;
        }
    }
    t.toMathML = function() {
        var i;
        var o = t.objective.toMathML();
        var c = t.constraints.map((x) => MathML.node("mtr", MathML.node("mtd", MathML.node("mrow", x.toMathML()))));
        var ge_zero = [];
        for (i = 0; i <= t.maxVariable; i++) {
            if (i !== 0)
                ge_zero.push(MathML.node("mo", textNode(",")));
            ge_zero = ge_zero.concat(defaultVariables(i));
        }
        ge_zero.push(MathML.node("mo", textNode("≥")));
        ge_zero.push(MathML.node("mn", textNode("0")));
        ge_zero = MathML.node("mtr", MathML.node("mtd", MathML.node("mrow", ge_zero)));
        c = c.concat(ge_zero);
		if (integerVariables.length > 0) {
			integerVariables.sort();
			var b = true;
			var integers = [];
			for (i = 0; i < integerVariables.length; i++) {
				if (b) {
					b = false;
				} else {
					integers.push(MathML.node("mo", textNode(",")));
				}
				integers = integers.concat(defaultVariables(integerVariables[i]));
			}
			integers.push(MathML.node("mo", textNode("\u2208"))); // &isin;
			integers.push(MathML.node("mi", textNode("\u2124"), {"mathvariant": "normal"})); // &integers;
			integers = MathML.node("mtr", MathML.node("mtd", MathML.node("mrow", integers)));
			c = c.concat(integers);
        }
        c = MathML.node("mtable", c, {"columnalign": "center"});
        var left = MathML.node("mo", textNode("{"), {"fence": "true", "form": "prefix"});
        var right = MathML.node("mo", textNode(""), {"fence": "true", "form": "postfix"});
        return [o, MathML.node("mrow", [left, c, right])];
    };
    return t;
}

function SimplexTable(A, B, D, d, basicVariables, iteration = 0) {
    var t = {};
    t.A = A;
    t.B = B;
    t.D = D;
    t.d = d;
    t.basicVariables = basicVariables;
    t.iteration = iteration;
    t.toMathML = function() {
		var i, j, mtd;
		var theFirstRow = [];
		var mi = MathML.node("mi", textNode("T"));
		var mn = MathML.node("mn", textNode(this.iteration.toString()));
		var msup = MathML.node("msup", [mi, mn]);
		var cell_T = MathML.node("mtd", msup, {"style": "border-right: solid; border-bottom: solid;"});
		theFirstRow.push(cell_T);
		mi = MathML.node("mi", textNode("f"));
		var cell_f = MathML.node("mtd", mi, {"style": "border-right: solid; border-bottom: solid;"});
		theFirstRow.push(cell_f);
		for (i = 0; i < A[0].length; i++) {
			var cell = MathML.node("mtd", defaultVariables(i), {"style": "border-bottom: solid"});
			theFirstRow.push(cell);
		}
		mi = MathML.node("mi", textNode("b"));
		var cell_b = MathML.node("mtd", mi, {"style": "border-bottom: solid; border-left: solid;"});
		theFirstRow.push(cell_b);
		theFirstRow = MathML.node("mtr", theFirstRow);		
		var rows = [theFirstRow];
		for (i = 0; i < A.length; i++) {
			var t = defaultVariables(basicVariables[i]);
			var cell_basicVariable = MathML.node("mtd", t, {"style": "border-right: solid;"});
			var thisRow = [cell_basicVariable];
			var justZero = MathML.node("mn", textNode(0));
			justZero = MathML.node("mtd", justZero, {"style": "border-right: solid;"});
			thisRow.push(justZero);
			for (j = 0; j < A[i].length; j++) {
				mn = MathML.node("mn", A[i][j].toMathML());
				mtd = MathML.node("mtd", mn);
				thisRow.push(mtd);
			}
			mn = MathML.node("mn", B[i].toMathML());
			mtd = MathML.node("mtd", mn, {"style": "border-left: solid;"});
			thisRow.push(mtd);
			thisRow = MathML.node("mtr", thisRow);
			rows.push(thisRow);
		}
		var theLastRow = [];
		var justF = MathML.node("mi", textNode("f"));
		justF = MathML.node("mtd", justF, {"style": "border-right: solid; border-top: solid;"});
		theLastRow.push(justF);
		var justOne = MathML.node("mn", textNode("1"));
		justOne = MathML.node("mtd", justOne, {"style": "border-right: solid; border-top: solid;"});
		theLastRow.push(justOne);
		for (j = 0; j < A[0].length; j++) {
		    var currentCell = MathML.node("mtd", D[j].toMathML(), {"style": "border-top: solid"});
			theLastRow.push(currentCell);
		}
		var theLastCell = MathML.node("mtd", d.toMathML(), {"style": "border-top: solid; border-left: solid;"});
		theLastRow.push(theLastCell);
		theLastRow = MathML.node("mtr", theLastRow);
		rows.push(theLastRow);
		var center = [];
		for (i = 0; i < A[0].length + 3; i++) {
			center.push("center");
		}
		center = center.join(" ");
		return MathML.node("mtable", rows, {"columnalign": center});
    };
	return t;
}

/*
  <mtable columnalign="center center center center center center center center">
    <mtr>
      <mtd >
        <mn>0</mn>
      </mtd>
    </mtr>
  </mtable>
*/
