/* jshint esversion: 11 */
"use strict";

BigInt.prototype.toJSON = function() {
    return this.toString();
};

// Randomness stuff

var randomChoice = function(a) {
    return a[Math.floor(Math.random() * a.length)];
};

var randomInt = function(a, b) {
    return Math.floor(Math.random() * (b - a + 1)) + a;
};

var randomIntWithFilter = function(a, b, criteria) {
    var r = randomInt(a, b);
    while (!criteria(r)) {
        r = randomInt(a, b);
    }
    return r;
};

// Stuff for making MathML elements 

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
    var t;
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

// Rational numbers and operations with them

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

var Fraction = function(numerator, denominator = 1n) {
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
            return [MathML.node("mn", textNode(0n))];
        }
        if (f.denominator === 1n && f.numerator > 0n) {
            return [MathML.node("mn", textNode(f.numerator))];
        }
        if (f.denominator === 1n && f.numerator < 0n) {
            mn = MathML.node("mn", textNode(-f.numerator));
            mo = MathML.node("mo", textNode("-"));
            return [mo, mn];
        }
        if (f.denominator !== 1n && f.numerator > 0n) {
            a = MathML.node("mn", textNode(f.numerator));
            b = MathML.node("mn", textNode(f.denominator));
            return [MathML.node("mfrac", [a, b])];
        }
        if (f.denominator !== 1n && f.numerator < 0n) {
            a = MathML.node("mn", textNode(-f.numerator));
            b = MathML.node("mn", textNode(f.denominator));
            minus = MathML.node("mo", textNode("-"));
            return [minus, MathML.node("mfrac", [a, b])];
        }
    };    
    return f;
};

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
    return Fraction(f1.numerator * f2.denominator - f2.numerator * f1.denominator, f1.denominator * f2.denominator);
}
function multiplyFractions(f1, f2) {
    return Fraction(f1.numerator * f2.numerator, f1.denominator * f2.denominator);
}
function divideFractions(f1, f2) {
    return Fraction(f1.numerator * f2.denominator, f1.denominator * f2.numerator);
}
function ltFractions(f1, f2) {
    return (f1.numerator * f2.denominator - f2.numerator * f1.denominator < 0n);
}
function leFractions(f1, f2) {
    return (f1.numerator * f2.denominator - f2.numerator * f1.denominator <= 0n);
}
function eqFractions(f1, f2) {
    return (f1.numerator * f2.denominator === f1.denominator * f2.numerator);
}
function minimumFraction(fs) {
    if (fs.length === 0) {
        throw("Empty array, can't find minimum value");
    }
    var m = fs[0];
    for (var i = 1; i < fs.length; i++) {
        if (ltFractions(fs[i], m)) {
            m = fs[i];
        }
    }
    return m;
}

// Function for getting variables as MathML elements. 0 => x1, 1 => x2, etc.

function defaultVariables(n) {
    var mi, mn, msub;
    mi = MathML.node("mi", textNode("x"));
    mn = MathML.node("mn", textNode(n + 1));
    return MathML.node("msub", [mi, mn]);
}

// Stuff for Big M method

var numberWithM = function(a, b = Fraction(0)) {
    var t = {};
    t.a = a;
    t.b = b;
	t.eq = function(x) {
		return (eqFractions(t.a, x.a) && eqFractions(t.b, x.b));
	};
    t.lt = function(x) {
        if (ltFractions(t.b, x.b)) {
            return true;
        }
        if (ltFractions(x.b, t.b)) {
            return false;
        }
        return (ltFractions(t.a, x.a));
    };
    t.multiply = function(multiplierFraction) {
        return numberWithM(multiplyFractions(t.a, multiplierFraction), multiplyFractions(t.b, multiplierFraction));
    };
    t.divide = function(divisorFraction) {
        if (eqFractions(divisorFraction, Fraction(0))) {
            throw("NumberWithM divided by zero.");
        }
        return numberWithM(divideFractions(t.a, divisorFraction), divideFractions(t.b, divisorFraction));
    };
    t.add = function(x) {
        return numberWithM(addFractions(t.a, x.a), addFractions(t.b, x.b));
    };
    t.substract = function(x) {
        return numberWithM(substractFractions(t.a, x.a), substractFractions(t.b, x.b));
    };
    t.opposite = function() {
        return numberWithM(oppositeFraction(t.a), oppositeFraction(t.b));
    };
    t.toMathML = function() {
        var math;
        if (eqFractions(t.a, Fraction(0))) {
            if (eqFractions(t.b, Fraction(0))) {
                return [MathML.node("mn", textNode("0"))];
            }
            if (eqFractions(t.b, Fraction(1))) {
                return [MathML.node("mi", textNode("M"))];
            }
            if (eqFractions(t.b, Fraction(-1))) {
                return [MathML.node("mo", textNode("-")), MathML.node("mi", textNode("M"))];
            }
            if (ltFractions(Fraction(0), t.b)) {
                math = t.b.toMathML();
                math.push(MathML.node("mi", textNode("M")));
                return math;
            }
            if (ltFractions(t.b, Fraction(0))) {
                math = [MathML.node("mo", textNode("-"))];
                math = math.concat(oppositeFraction(t.b).toMathML());
                math.push(MathML.node("mi", textNode("M")));
                return math;
            }
        }
        if (eqFractions(t.b, Fraction(0))) {
            return t.a.toMathML();
        }
        math = t.a.toMathML();
        if (eqFractions(t.b, Fraction(1))) {
            math.push(MathML.node("mo", textNode("+")));
            math.push(MathML.node("mi", textNode("M")));
            return math;
        }
        if (eqFractions(t.b, Fraction(-1))) {
            math.push(MathML.node("mo", textNode("-")));
            math.push(MathML.node("mi", textNode("M")));
            return math;
        }
        if (ltFractions(Fraction(0), t.b)) {
            math.push(MathML.node("mo", textNode("+")));
            math = math.concat(t.b.toMathML());
            math.push(MathML.node("mi", textNode("M")));
            return math;
        }
        if (ltFractions(t.b, Fraction(0))) {
            math.push(MathML.node("mo", textNode("-")));
            math = math.concat(oppositeFraction(t.b).toMathML());
            math.push(MathML.node("mi", textNode("M")));
            return math;
        }
    };
    return t;
};

// Linear expressions as coefficients. [a, b, c, d, ...] means linear expression a*x1+b*x2+c*x3+d*x4+...

function LinearExpression(coefficients) {
    var t = {};
    t.coefficients = coefficients;
    t.opposite = function() {
        var new_t = {};
        for (var i = 0; i < t.coefficients.length; i++) {
            new_t.coefficients[i] = -t.coefficients[i];
        }
        return LinearExpression(new_t);
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

// Objective function made from coefficients and boolean (if true, then objective function has to be maximised, if false - minimised)

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

// Linear constraint made from coefficients, free coefficient (?) and the sign (which can be "le" (<=), "eq" (=) or "ge" (>=)).

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

LPP.SimplexTableWithM = function(A, B, D, d, basicVariables, startVariables, artificialVariables, iteration = 0) {
    var t = {};
    t.A = A;
    t.B = B;
    t.D = D; // contains M
    t.d = d; // contains M ?
    t.startVariables = startVariables;
    t.basicVariables = basicVariables;
    t.artificialVariables = artificialVariables;
    t.iteration = iteration;
    t.copy = function() {
        var i, j;
        var tempA = [];
        for (i = 0; i < t.A.length; i++) {
            tempA.push([]);
            for (j = 0; j < t.A[i].length; j++) {
                tempA[i].push(t.A[i][j]);
            }
        }
        var tempB = [];
        for (i = 0; i < t.B.length; i++) {
            tempB.push(t.B[i]);
        }
        var tempD = [];
        for (i = 0; i < t.D.length; i++) {
            tempD.push(t.D[i]);
        }
        var tempBasicVariables = [];
        for (i = 0; i < t.basicVariables.length; i++) {
            tempBasicVariables.push(t.basicVariables[i]);
        }
        var tempStartVariables = [];
        for (i = 0; i < t.startVariables.length; i++) {
            tempStartVariables.push(t.startVariables[i]);
        }
        var tempArtificialVariables = [];
        for (i = 0; i < t.artificialVariables.length; i++) {
            tempArtificialVariables.push(t.artificialVariables[i]);
        }
        return LPP.SimplexTableWithM(tempA, tempB, tempD, t.d, tempBasicVariables, tempStartVariables, tempArtificialVariables, t.iteration);
    };
    t.possiblePivot = function(row, col) {
        if (t.D[col].lt(numberWithM(Fraction(0), Fraction(0)))) {
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
                    temp.push([i, j]);
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
            t.D[j] = t.D[j].substract(temp.multiply(t.A[row][j]));
        }
        t.d = t.d.substract(temp.multiply(t.B[row]));
        t.basicVariables[row] = col;
        t.iteration += 1;
    };
    t.getPlan = function() {
        var temp = [];
        for (var i = 0; i < t.startVariables.length; i++) {
            if (t.basicVariables.indexOf(t.startVariables[i]) >= 0) {
                temp.push(t.B[t.basicVariables.indexOf(t.startVariables[i])]);
            } else {
                temp.push(Fraction(0));
            }
        }
        return temp;
    };
    t.SolutionSkeleton = function() {
        var temp = t.copy();
        var listOfPivots = [];
        while (temp.allPossiblePivots().length > 0) {
            var pivot = randomChoice(temp.allPossiblePivots());
            listOfPivots.push(pivot);
            temp.moveToNextIteration(pivot[0], pivot[1]);
        }
        return [listOfPivots, temp.getPlan()];
    };
    t.toMathML = function(row = undefined, col = undefined) {
        var i, j, mtd;
        var theFirstRow = [];
        var mi = MathML.node("mi", textNode("T"));
        var mn = MathML.node("mn", textNode(this.iteration.toString())); // why "t.iteration" doesn't work?
        var msup = MathML.node("msup", [mi, mn]);
        var cell_T = MathML.node("mtd", msup, {"style": "border-right: solid; border-bottom: solid;"});
        theFirstRow.push(cell_T);
        for (i = 0; i < this.A[0].length; i++) {
            var cell;
            if (i === col) {
                cell = MathML.node("mtd", defaultVariables(i), {"style": "border-bottom: solid; background-color: pink;"});
            } else {
                cell = MathML.node("mtd", defaultVariables(i), {"style": "border-bottom: solid;"});
            }
            theFirstRow.push(cell);
        }
        mi = MathML.node("mi", textNode("b"));
        var cell_b = MathML.node("mtd", mi, {"style": "border-bottom: solid; border-left: solid;"});
        theFirstRow.push(cell_b);
        theFirstRow = MathML.node("mtr", theFirstRow);      
        var rows = [theFirstRow];
        for (i = 0; i < this.A.length; i++) {
            var t = defaultVariables(basicVariables[i]);
            var cell_basicVariable;
            if (i === row) {
                cell_basicVariable = MathML.node("mtd", t, {"style": "border-right: solid; background-color: pink;"});
            } else {
                cell_basicVariable = MathML.node("mtd", t, {"style": "border-right: solid;"});
            }
            var thisRow = [cell_basicVariable];
            for (j = 0; j < this.A[i].length; j++) {
                if (j === col || i === row) {
                    mtd = MathML.node("mtd", this.A[i][j].toMathML(), {"style": "background-color: pink;"});
                } else {
                    mtd = MathML.node("mtd", this.A[i][j].toMathML());
                }
                thisRow.push(mtd);
            }
            if (i === row) {
                mtd = MathML.node("mtd", this.B[i].toMathML(), {"style": "border-left: solid; background-color: pink;"});
            } else {
                mtd = MathML.node("mtd", this.B[i].toMathML(), {"style": "border-left: solid;"});
            }
            thisRow.push(mtd);
            thisRow = MathML.node("mtr", thisRow);
            rows.push(thisRow);
        }
        var theLastRow = [];
        var justF = MathML.node("mi", textNode("f"));
        justF = MathML.node("mtd", justF, {"style": "border-right: solid; border-top: solid;"});
        theLastRow.push(justF);
        for (j = 0; j < this.D.length; j++) {
            var currentCell;
            if (j === col) {
                currentCell = MathML.node("mtd", this.D[j].toMathML(), {"style": "border-top: solid; background-color: pink;"});
            } else {
                currentCell = MathML.node("mtd", this.D[j].toMathML(), {"style": "border-top: solid"});
            }
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
    t.ExplainedSolution = function(id) {
        var p, mi, mn, msub;
        var temp = t.copy();
        var skeleton = temp.SolutionSkeleton();
        var place = document.getElementById(id);		
        for (var i = 0; i < skeleton[0].length; i++) {
            var row = skeleton[0][i][0];
            var col = skeleton[0][i][1];
            var start = MathML.done(temp.toMathML(row, col));
            p = document.createElement("p");
            p.appendChild(start);
            place.appendChild(p);
            p = document.createElement("p");
            mi = MathML.node("mi", textNode("D"));
            var mn1 = MathML.node("mn", textNode(col + 1));
            msub = MathML.node("msub", [mi, mn1]);
            var mo1 = MathML.node("mo", textNode("="));
            var mo2 = MathML.node("mo", textNode("<"));
            var mn2 = MathML.node("mn", textNode("0"));
            var L = [msub, mo1];
            L = L.concat(temp.D[col].toMathML());
            L = L.concat([mo2, mn2]);
            p.appendChild(textNode("Chosen pivot column is " + (col + 1).toString() + ", because "));
            p.appendChild(MathML.done([L]));
            p.appendChild(textNode(". "));
            p.appendChild(textNode("Chosen pivot row is " + (row + 1).toString() + ", because "));
            var rows = [], k;
            for (k = 0; k < temp.B.length; k++) {
                if (ltFractions(Fraction(0), temp.A[k][col])) {
                    rows.push(k);
                }
            }
            if (rows.length > 1) {
                var L0 = [], fs = [];
                for (k = 0; k < rows.length; k++) {
                    L = [];
                    mi = MathML.node("mi", textNode("b"));
                    mn = MathML.node("mn", textNode(rows[k]+1));
                    var b_mathML = MathML.node("msub", [mi, mn]);
                    mi = MathML.node("mi", textNode("A"));
                    var first_index = MathML.node("mn", textNode(rows[k]+1));
                    var comma = MathML.node("mo", textNode(","));
                    var second_index = MathML.node("mn", textNode(col+1));
                    var A_mathML = MathML.node("msub", [mi, MathML.row([first_index, comma, second_index])]);
                    var b_div_A = MathML.node("mfrac", [b_mathML, A_mathML]);
                    var eq_sign = MathML.node("mo", textNode("="));
                    L = [b_div_A, eq_sign];
                    var num = temp.B[rows[k]].toMathML();
                    num = MathML.row(num);
                    var den = temp.A[rows[k]][col].toMathML();
                    den = MathML.row(den);
                    var b_div_A_frac = MathML.node("mfrac", [num, den]);
                    L.push(b_div_A_frac);
                    L.push(MathML.node("mo", textNode("=")));
                    var f = divideFractions(temp.B[rows[k]], temp.A[rows[k]][col]);
                    fs.push(f);
                    L = L.concat(f.toMathML());
                    p.appendChild(MathML.done([L]));
                    if (k < rows.length - 1) {
                        p.appendChild(textNode(", "));
                    } else {
                        p.appendChild(textNode(" and "));
                    }
                    L0 = L0.concat(f.toMathML());
                    if (k < rows.length - 1) {
                        L0.push(MathML.node("mo", textNode(",")));
                    }
                }
                var leftBracket = MathML.node("mo", textNode("("), {"fence": "true", "form": "prefix"});
                var rightBracket = MathML.node("mo", textNode(")"), {"fence": "true", "form": "postfix"});
                var brackets = [leftBracket];
                brackets = brackets.concat(MathML.row(L0));
                brackets.push(rightBracket);
                var min = MathML.node("mi", textNode("min"));
                var eq = MathML.node("mo", textNode("="));
                var minimumValue = minimumFraction(fs).toMathML();
                var expression = [min];
                expression = expression.concat(brackets);
                expression.push(eq);
                expression = expression.concat(minimumValue);
                p.appendChild(MathML.done([expression]));
                p.appendChild(textNode("."));
            } else {
                p.appendChild(textNode("there is only one row with strictly positive value (in the column)."));
            }
            place.appendChild(p);
            temp.moveToNextIteration(row, col);
        }
        p = document.createElement("p");
        p.appendChild(MathML.done(temp.toMathML()));
        place.appendChild(p);
        p = document.createElement("p");
        p.appendChild(textNode("This is the final iteration. "));
        if (temp.D.some((x) => x.lt(numberWithM(Fraction(0))))) {
            p.appendChild(textNode("The objective function is unbounded."));
        } else {
            if (!eqFractions(temp.d.b, Fraction(0))) {
                p.appendChild(textNode("Plan set is empty."));
            } else {
                var plan = temp.getPlan(), mo;
                p.appendChild(textNode("The optimal plan and the value of objective function: "));
                place.appendChild(p);
                for (i = 0; i < temp.startVariables.length; i++) {
                    mi = MathML.node("mi", textNode("x"));
                    mn = MathML.node("mn", textNode(temp.startVariables[i] + 1));
                    msub = MathML.node("msub", [mi, mn]);
                    mo = MathML.node("mo", textNode("="));
                    var x_has_value = [msub, mo];
                    x_has_value = x_has_value.concat(plan[i].toMathML());
                    x_has_value = MathML.done([x_has_value]);
                    p.appendChild(x_has_value);
                    p.appendChild(textNode(", "));
                }
                mi = MathML.node("mi", textNode("f"));
                mo = MathML.node("mo", textNode("="));
                var f_has_value = [mi, mo];
                f_has_value = f_has_value.concat(temp.d.toMathML());
                f_has_value = MathML.done([f_has_value]);
                p.appendChild(f_has_value);
                p.appendChild(textNode("."));
            }
        }
        place.appendChild(p);
    };
    return t;
};

LPP.CanonicalForm = function(c, A, b, artificialVariables, integerVariables = []) {
	var t = {};
	t.c = c;
	t.A = A;
	t.b = b;
	t.artificialVariables = artificialVariables;
	t.integerVariables = integerVariables;
	t.toMathML = function() {
		var i = 0;
		var temp = LinearExpression(t.c).toMathML();
		for (i = 0; i < artificialVariables.length; i++) {
			temp.push(MathML.node("mo", textNode("-")));
			temp.push(MathML.node("mi", textNode("M")));
			temp = temp.concat(defaultVariables(artificialVariables[i]));
		}
		temp.push(MathML.node("mo", textNode("→"), {"stretchy": "false"}));
        temp.push(MathML.node("mi", textNode("max")));
		var cc = [];
        for (i = 0; i < t.A.length; i++) {
            cc.push(MathML.node("mtr", MathML.node("mtd", MathML.node("mrow", LinearConstraint(t.A[i], t.b[i], "eq").toMathML()))));
        }
        var ge_zero = [];
        for (i = 0; i < t.A[0].length; i++) {
            if (i !== 0)
                ge_zero.push(MathML.node("mo", textNode(",")));
            ge_zero.push(defaultVariables(i));
        }
        ge_zero.push(MathML.node("mo", textNode("≥")));
        ge_zero.push(MathML.node("mn", textNode("0")));
        ge_zero = MathML.node("mtr", MathML.node("mtd", MathML.node("mrow", ge_zero)));
        cc.push(ge_zero);
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
            cc = cc.concat(integers);
        }
        cc = MathML.node("mtable", cc, {"columnalign": "center"});
        var left = MathML.node("mo", textNode("{"), {"fence": "true", "form": "prefix"});
        var right = MathML.node("mo", textNode(""), {"fence": "true", "form": "postfix"});
        return [temp, MathML.node("mrow", [left, cc, right])];
	};
	return t;
}


LPP.NormalForm = function(c, A, b, artificialVariables, integerVariables = []) { // f = C^T x -> max, A x <= b, x >= 0, with possible integer variables
    var t = {};
    t.c = c;
    t.A = A;
    t.b = b;
	t.artificialVariables = artificialVariables;
    t.integerVariables = integerVariables;
    t.toMathML = function() {
        var i;
        var o = ObjectiveFunction(t.c).toMathML();
        var cc = [];
        for (i = 0; i < t.A.length; i++) {
            cc.push(MathML.node("mtr", MathML.node("mtd", MathML.node("mrow", LinearConstraint(t.A[i], t.b[i]).toMathML()))));
        }
        var ge_zero = [];
        for (i = 0; i < t.c.length; i++) {
            if (i !== 0)
                ge_zero.push(MathML.node("mo", textNode(",")));
            ge_zero.push(defaultVariables(i));
        }
        ge_zero.push(MathML.node("mo", textNode("≥")));
        ge_zero.push(MathML.node("mn", textNode("0")));
        ge_zero = MathML.node("mtr", MathML.node("mtd", MathML.node("mrow", ge_zero)));
        cc.push(ge_zero);
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
            cc = cc.concat(integers);
        }
        cc = MathML.node("mtable", cc, {"columnalign": "center"});
        var left = MathML.node("mo", textNode("{"), {"fence": "true", "form": "prefix"});
        var right = MathML.node("mo", textNode(""), {"fence": "true", "form": "postfix"});
        return [o, MathML.node("mrow", [left, cc, right])];
    };
	t.toCanonicalForm = function() {
		var i, j;
		var newA = [], newB = [];
        var position = 0;
        var artificialVariables = [];
        var countNegativeBs = 0;
		var newC = [];
		
        for (i = 0; i < t.A.length; i++) {
			if (ltFractions(t.b[i], Fraction(0))) {
                countNegativeBs += 1;
            }
			var temp = [];
			for (j = 0; j < t.A[0].length; j++) {
				temp.push(t.A[i][j]);
			}
			newB.push(t.b[i]);
			newA.push(temp);
        }
        for (i = 0; i < t.A.length; i++) {
			temp = [];
            if (ltFractions(t.b[i], Fraction(0))) {
                for (j = 0; j < t.A.length + countNegativeBs; j++) {
                    if (j === position) {
                        temp.push(Fraction(1));
                    }
                    if (j === position + 1) {
                        temp.push(Fraction(-1));
                        artificialVariables.push(t.c.length + j);
                    }
                    if (j !== position && j !== position + 1) {
                        temp.push(Fraction(0));
                    }
                }
                position += 2;
            } else {
                for (j = 0; j < t.A.length + countNegativeBs; j++) {
                    if (j === position) {
                        temp.push(Fraction(1));
                    } else {
                        temp.push(Fraction(0));
                    }
                }
                position += 1;
            }
            newA[i] = newA[i].concat(temp);
        }
		for (i = 0; i < t.c.length; i++) {
			newC.push(t.c[i]);
		}
		for (i = 0; i < newA.length; i++) {
			if (ltFractions(t.b[i], Fraction(0))) {
				for (j = 0; j < newA[0].length; j++) {
					newA[i][j] = oppositeFraction(newA[i][j]);
				}
				newB[i] = oppositeFraction(newB[i]);
			}
		}
		return LPP.CanonicalForm(newC, newA, newB, artificialVariables);
	};
    t.toSimplexTableWithM = function(id) {
        var i, j;
        var rowsWithArtificialVariables = [];
        var newA = [];
        var position = 0;
        var artificialVariables = [];
        var countNegativeBs = 0;
        for (i = 0; i < t.b.length; i++) {
            if (ltFractions(t.b[i], Fraction(0))) {
                countNegativeBs += 1;
            }
        }
		var d = Fraction(0);
        var newD = [];
        for (i = 0; i < t.c.length; i++) {
            newD.push(numberWithM(oppositeFraction(t.c[i])));
        }
        var basicVariables = [];
        for (i = 0; i < t.A.length; i++) {
            var temp = [];
            for (j = 0; j < t.c.length; j++) {
                temp.push(t.A[i][j]);
            }
            if (ltFractions(t.b[i], Fraction(0))) {
                for (j = 0; j < t.A.length + countNegativeBs; j++) {
                    if (j === position) {
                        temp.push(Fraction(1));
                        newD.push(numberWithM(Fraction(0)));
                        basicVariables.push(t.c.length + position);
                    }
                    if (j === position + 1) {
                        temp.push(Fraction(-1));
                        newD.push(numberWithM(Fraction(0), Fraction(1)));
                        artificialVariables.push(t.c.length + j);
                        rowsWithArtificialVariables.push(i);
                    }
                    if (j !== position && j !== position + 1) {
                        temp.push(Fraction(0));
                    }
                }
                position += 2;
            } else {
                for (j = 0; j < t.A.length + countNegativeBs; j++) {
                    if (j === position) {
                        temp.push(Fraction(1));
                        newD.push(numberWithM(Fraction(0)));
                        basicVariables.push(t.c.length + position);
                    } else {
                        temp.push(Fraction(0));
                    }
                }
                position += 1;
            }
            newA.push(temp);
        }
        var newB = [];
        for (i = 0; i < t.b.length; i++) {
            newB.push(t.b[i]);
        }
        var d = numberWithM(Fraction(0));
        var startVariables = [];
        for (i = 0; i < t.c.length; i++) {
            startVariables.push(i);
        }
		
		for (i = 0; i < newB.length; i++) {
            if (ltFractions(newB[i], Fraction(0))) {
                newB[i] = oppositeFraction(newB[i]);
                for (j = 0; j < newA[0].length; j++) {
                    newA[i][j] = oppositeFraction(newA[i][j]);
                }
            }
        }
		
		if (id !== undefined && countNegativeBs > 0) {
			var place = document.getElementById(id);
			var p = document.createElement("p");
			place.appendChild(p);
			p.appendChild(textNode("We get such LPP after transforming it."));
			place.appendChild(p);
			var LPP_canonical = LPP_normal.toCanonicalForm();
			place.appendChild(MathML.done(LPP_canonical.toMathML()));
			
			p = document.createElement("p");
			p.appendChild(MathML.done((LPP.SimplexTableWithM(newA, newB, newD, d, basicVariables, artificialVariables, 0).toMathML())));
			place.appendChild(p);
			p = document.createElement("p");
			p.appendChild(textNode("Before we start using the simplex algorithm, we have to substract rows that have artificial variables (multiplied by M) from the last row. That corresponds to expressing the artificial variables from equations (of the canonical form) and then substituting into the objective function."));
			place.appendChild(p);
		}		
		
        for (i = 0; i < rowsWithArtificialVariables.length; i++) {
            for (j = 0; j < newD.length; j++) {
                newD[j] = newD[j].substract(numberWithM(Fraction(0), Fraction(1)).multiply(newA[rowsWithArtificialVariables[i]][j]));
            }
            d = d.substract(numberWithM(Fraction(0), Fraction(1)).multiply(newB[rowsWithArtificialVariables[i]]));
        }		
                
        return LPP.SimplexTableWithM(newA, newB, newD, d, basicVariables, startVariables, artificialVariables, 0);
    };
    return t;
};
