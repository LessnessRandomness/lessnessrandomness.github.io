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

// function simplifyFraction(f) {
    // f = Fraction(f.numerator, f.denominator);
// }
function invertedFraction(f) {
    return Fraction(f.denominator, f.numerator);
}
function oppositeFraction(f) {
    return Fraction(-f.numerator, f.denominator);
}
function addFractions(f1, f2) {
    return Fraction(f1.numerator * f2.denominator + f2.numerator * f1.denominator, f1.denominator * f2.denominator);
}
function substractFractions(f1, f2) {
    return addFractions(f1, oppositeFraction(f2));
}
function multiplyFractions(f1, f2) {
    return Fraction(f1.numerator * f2.numerator, f1.denominator * f2.denominator);
}
function divideFractions(f1, f2) {
    return multiplyFractions(f1, invertedFraction(f2));
}
function ltFractions(f1, f2) {
    return (substractFractions(f1, f2).numerator < 0n);
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
    t.opposite = function() {
        var new_t = {};
        for (var i = 0; i < t.coefficients.length; i++) {
            new_t.coefficients[i] = -t.coefficients;
        }
        return new_t;
    };
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

function ObjectiveFunction(coefficients, maximum = true) {
    var t = {};
    t.coefficients = coefficients;
    t.maximum = maximum;
    t.opposite = function() {
        var new_t = {};
        new_t.coefficients = t.coefficients.map((x) => -x);
        new_t.maximum = ! t.maximum;
        return new_t;
    };
    t.toMathML = function() {
        var math = LinearExpression(t.coefficients).toMathML();
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
    return t;
}

function LinearConstraint(coefficients, b, sign = "le") {
    var t = {};
    t.coefficients = coefficients;
    t.B = b;
    t.sign = sign;
    t.revertSign = function() {
        var new_t = {};
        if (t.sign !== "eq") {
            new_t.coefficients = t.coefficients.map((x) => -x);
            new_t.B = -t.B;
            if (t.sign === "le") {
                new_t.sign = "ge";
            } else {
                new_t.sign = "le";
            }
        } else {
            new_t.coefficients = t.coefficients;
            new_t.sign = t.sign;
            new_t.B = t.B;
        }
        return new_t;
    };
    t.toMathML = function() {
        var math = LinearExpression(t.coefficients).toMathML();
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
    return t;
}

var LPP = {};

LPP.NormalForm = function (c, A, b, integerVariables = []) { // f = C^T x -> max, A x <= b, x >= 0, with possible integer variables
    var t = {};
    t.c = c;
    t.A = A;
    t.b = b;
    t.integerVariables = integerVariables;
    t.maxVariable = t.c.length-1;
    if (t.A[0].length-1 > t.maxVariable) {
        t.maxVariable = t.A[0].length-1;
    }
    t.toMathML = function() {
        var i;
        var o = ObjectiveFunction(t.c).toMathML();
        var c = [];
        for (i = 0; i < t.A.length; i++) {
            c.push(MathML.node("mtr", MathML.node("mtd", MathML.node("mrow", LinearConstraint(t.A[i], t.b[i]).toMathML()))));
        }
        var ge_zero = [];
        for (i = 0; i <= t.maxVariable; i++) {
            if (i !== 0)
                ge_zero.push(MathML.node("mo", textNode(",")));
            ge_zero.push(defaultVariables(i));
        }
        ge_zero.push(MathML.node("mo", textNode("≥")));
        ge_zero.push(MathML.node("mn", textNode("0")));
        ge_zero = MathML.node("mtr", MathML.node("mtd", MathML.node("mrow", ge_zero)));
        c.push(ge_zero);
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
};

LPP.CanonicalForm = function(c, A, b, integerVariables = []) { // f = C^T x -> max, A x = b, x >= 0, with possible integer variables
    var t = {};
    t.c = c;
    t.A = A;
    t.b = b;
    t.integerVariables = integerVariables;
    t.maxVariable = t.c.length-1;
    if (t.A[0].length-1 > t.maxVariable) {
        t.maxVariable = t.A[0].length-1;
    }
    t.toMathML = function() {
        var i;
        var o = ObjectiveFunction(t.c).toMathML();
        var c = [];
        for (i = 0; i < t.A.length; i++) {
            c.push(MathML.node("mtr", MathML.node("mtd", MathML.node("mrow", LinearConstraint(t.A[i], t.b[i], "eq").toMathML()))));
        }
        var ge_zero = [];
        for (i = 0; i <= t.maxVariable; i++) {
            if (i !== 0)
                ge_zero.push(MathML.node("mo", textNode(",")));
            ge_zero.push(defaultVariables(i));
        }
        ge_zero.push(MathML.node("mo", textNode("≥")));
        ge_zero.push(MathML.node("mn", textNode("0")));
        ge_zero = MathML.node("mtr", MathML.node("mtd", MathML.node("mrow", ge_zero)));
        c.push(ge_zero);
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
};

LPP.SimplexTable = function(A, B, D, d, basicVariables, iteration = 0) {
    var t = {};
    t.A = A;
    t.B = B;
    t.D = D;
    t.d = d;
    t.basicVariables = basicVariables;
    t.iteration = iteration;
    t.possiblePivot = function(row, col) {
        if (ltFractions(t.D[col], Fraction(0))) {
            if (ltFractions(Fraction(0), t.A[row][col])) {
                for (var i = 0; i < t.B.length; i++) {
                    if (ltFractions(Fraction(0), t.A[i][col])) {
                        if (ltFractions(divideFractions(t.B[i], t.A[i][col]), divideFractions(t.B[row], t.A[row][col]))) {
                            return false;
                        }
                    }
                }
                return true;
            }
        }
        return false;
    };
    t.allPossiblePivots = function() {
        var temp = [];
        for (var i = 0; i < A.length; i++) {
            for (var j = 0; j < A[0].length; j++) {
                if (t.possiblePivot(i, j)) {
                    temp.push([i,j]);
                }
            }
        }
        return temp;
    };
    t.moveToNextIteration = function(row, col) {
        var i, j, temp;
        if (!t.possiblePivot(row,col)) {
            throw("Bad pivot for the simplex table.");
        }
        for (i = 0; i < t.A[0].length; i++) {
            if (i !== col) {
                t.A[row][i] = divideFractions(t.A[row][i], t.A[row][col]);
            }
        }
        t.B[row] = divideFractions(t.B[row], t.A[row][col]);
        t.A[row][col] = Fraction(1);
        for (i = 0; i < t.A.length; i++) {
            if (i !== row) {
                temp = t.A[i][col];
                for (j = 0; j < t.A[0].length; j++) {
                    t.A[i][j] = substractFractions(t.A[i][j], multiplyFractions(temp, t.A[row][j]));
                }
                t.B[i] = substractFractions(t.B[i], multiplyFractions(temp, t.B[row]));
            }
        }
        temp = t.D[col];
        for (j = 0; j < t.D.length; j++) {
            t.D[j] = substractFractions(t.D[j], multiplyFractions(temp, t.A[row][j]));
        }
        t.d = substractFractions(t.d, multiplyFractions(temp, t.B[row]));
		t.basicVariables[row] = col;
    };
    t.toMathML = function() {
        var i, j, mtd;
        var theFirstRow = [];
        var mi = MathML.node("mi", textNode("T"));
        var mn = MathML.node("mn", textNode(this.iteration.toString())); // why "t.iteration" doesn't work?
        var msup = MathML.node("msup", [mi, mn]);
        var cell_T = MathML.node("mtd", msup, {"style": "border-right: solid; border-bottom: solid;"});
        theFirstRow.push(cell_T);
        for (i = 0; i < this.A[0].length; i++) {
            var cell = MathML.node("mtd", defaultVariables(i), {"style": "border-bottom: solid"});
            theFirstRow.push(cell);
        }
        mi = MathML.node("mi", textNode("b"));
        var cell_b = MathML.node("mtd", mi, {"style": "border-bottom: solid; border-left: solid;"});
        theFirstRow.push(cell_b);
        theFirstRow = MathML.node("mtr", theFirstRow);      
        var rows = [theFirstRow];
        for (i = 0; i < this.A.length; i++) {
            var t = defaultVariables(basicVariables[i]);
            var cell_basicVariable = MathML.node("mtd", t, {"style": "border-right: solid;"});
            var thisRow = [cell_basicVariable];
            for (j = 0; j < this.A[i].length; j++) {
                mtd = MathML.node("mtd", this.A[i][j].toMathML());
                thisRow.push(mtd);
            }
            mtd = MathML.node("mtd", this.B[i].toMathML(), {"style": "border-left: solid;"});
            thisRow.push(mtd);
            thisRow = MathML.node("mtr", thisRow);
            rows.push(thisRow);
        }
        var theLastRow = [];
        var justF = MathML.node("mi", textNode("f"));
        justF = MathML.node("mtd", justF, {"style": "border-right: solid; border-top: solid;"});
        theLastRow.push(justF);
        for (j = 0; j < this.A[0].length; j++) {
            var currentCell = MathML.node("mtd", this.D[j].toMathML(), {"style": "border-top: solid"});
            theLastRow.push(currentCell);
        }
        var theLastCell = MathML.node("mtd", this.d.toMathML(), {"style": "border-top: solid; border-left: solid;"});
        theLastRow.push(theLastCell);
        theLastRow = MathML.node("mtr", theLastRow);
        rows.push(theLastRow);
        var center = [];
        for (i = 0; i < this.A[0].length + 3; i++) {
            center.push("center");
        }
        center = center.join(" ");
        return MathML.node("mtable", rows, {"columnalign": center});
    };
    return t;
};
