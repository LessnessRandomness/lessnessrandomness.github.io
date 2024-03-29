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

var randomVector = function(size, a, b) {
	var v = [];
	for (var i = 0; i < size; i++) {
		v[i] = randomInt(a, b);
	}
	return v;
}

var randomMatrix = function(rows, cols, a, b) {
	var m = [];
	for (var i = 0; i < rows; i++) {
		m[i] = randomVector(cols, a, b);
	}
	return m;
}

// LinearExpression

class LinearExpression {
	constructor(coeffs) {
		this.coeffs = coeffs;
	}
	copy() {
		var t = [];
		for (var i = 0; i < this.coeffs.length; i++) {
			t.push(this.coeffs[i]);
		}
		return (new LinearExpression(t));
	}
	opposite() {
		return (new LinearExpression(this.coeffs.map((x) => x.opposite())));
	}
	replaceVariableWithDifference(n) {
		var newCoeffs = [];
		for (var i = 0; i < this.coeffs.length; i++) {
			newCoeffs.push(this.coeffs[i]);
		}
		newCoeffs.push(this.coeffs[n].opposite());
		return (new LinearExpression(newCoeffs));
	}
	toMathML(namingScheme = Variable.defaultVariables) {
		var exp = new Expression();
		for (var i = 0; i < this.coeffs.length; i++) {
			var variable = new Expression(new Variable(i));
			var term = variable.multiply(this.coeffs[i]);
			exp = exp.add(term);
		}
		return exp.toMathML(namingScheme);
	}
}

//

class LinearObjective {
	constructor(linexp, maximise = true) {
		this.linexp = linexp;
		this.maximise = maximise;
	}
	copy() {
		return new LinearObjective(this.linexp.copy(), this.maximise);
	}
	replaceVariableWithDifference(n) {
		return (new LinearObjective(this.linexp.replaceVariableWithDifference(n), this.maximise));
	}
	opposite() {
		var t = this.copy();
		t.linexp = this.linexp.opposite();
		t.maximise = !this.maximise;
		return t;
	}
	toMathML(namingScheme = Variable.defaultVariables) {
		var m = (this.linexp.toMathML(namingScheme));
		var arrow = new MathML("mo", textNode("→"));
		m.push(arrow);
		var mi = new MathML("mi", textNode(this.maximise ? "max" : "min"));
		m.push(mi);
		return m;
	}
}

// LinearConstraint

class LinearConstraint {
	constructor(linexp, b, sign = "le") {
		this.linexp = linexp;
		this.b = b;
		this.sign = sign;
	}
	copy() {
		return new LinearConstraint(this.linexp.copy(), this.b, this.sign);
	}
	revertSign() {
		var t = this.copy();
		if (t.sign !== "eq") {
			t.linexp = t.linexp.opposite();
			t.b = t.b.opposite();
			t.sign = (t.sign === "le") ? "ge" : "le";
		}
		return t;
	}
	equalityIntoTwoInequalities() {
		if (this.sign === "eq") {
			var c1 = new LinearConstraint(this.linexp, this.b, "le");
			var c2 = new LinearConstraint(this.linexp.opposite(), this.b.opposite(), "le");
			return [c1, c2];
		}
	}
	replaceVariableWithDifference(n) {
		return (new LinearConstraint(this.linexp.replaceVariableWithDifference(n), this.b, this.sign));
	}
	// for 2D case (two variables)
	intersection(other) {
		var a11 = this.linexp.coeffs[0], a12 = this.linexp.coeffs[1], b1 = this.b;
		var a21 = other.linexp.coeffs[0], a22 = other.linexp.coeffs[1], b2 = other.b;
		var delta = a11.multiply(a22).substract(a12.multiply(a21));
		if (delta.equalTo(new Fraction(0))) {
			return undefined;
		} else {
			var deltaX = b1.multiply(a22).substract(a12.multiply(b2));
			var deltaY = a11.multiply(b2).substract(b1.multiply(a21));
			return [deltaX.divide(delta), deltaY.divide(delta)];
		}
	}
	pointSatisfies(coords) {
		var value = new Fraction(0);
		for (var i = 0; i < this.linexp.coeffs.length; i++) {
			value = value.add(this.linexp.coeffs[i].multiply(coords[i]));
		}
		if (this.sign === "eq") {
			return value.equalTo(this.b);
		}
		if (this.sign === "le") {
			return value.lessOrEqual(this.b);
		}
		if (this.sign === "ge") {
			return this.b.lessOrEqual(value);
		}
	}
	toMathML(namingScheme = Variable.defaultVariables) {
		var m = this.linexp.toMathML(namingScheme);
		var mo;
		if (this.sign === "le") {
			mo = new MathML("mo", textNode("\u2264")); // &le;
		}
		if (this.sign === "eq") {
			mo = new MathML("mo", textNode("="));
		}
		if (this.sign === "ge") {
			mo = new MathML("mo", textNode("\u2265")); // &ge;
		}
		m.push(mo);
		m = m.concat(this.b.toMathML());
		return m;
	}
}

// Matrix stuff

class Matrix {
	constructor(matrix) {
		this.matrix = matrix;
		this.rows = matrix.length;
		this.cols = matrix[0].length;
	}
	copy() {
		var m = [];
		for (var i = 0; i < this.rows; i++) {
			var r = [];
			for (var j = 0; j < this.cols; j++) {
				r.push(this.matrix[i][j]);
			}
			m.push(r);
		}
		return (new Matrix(m));
	}
	removeColumn(col) {
		var m = [];
		for (var i = 0; i < this.rows; i++) {
			var r = [];
			for (var j = 0; j < this.cols; j++) {
				if (j !== col) {
					r.push(this.matrix[i][j]);
				}
			}
			m.push(r);
		}
		this.matrix = m;
		this.cols -= 1;
	}
	multiplyRow(row, k) {
		for (var i = 0; i < this.cols; i++) {
			this.matrix[row][i] = this.matrix[row][i].multiply(k);
		}
	}
	substractMultipliedRow(row1, row2, k = new Fraction(1)) {
		for (var i = 0; i < this.cols; i++) {
			this.matrix[row1][i] = this.matrix[row1][i].substract(this.matrix[row2][i].multiply(k));
		}
	}
	swapRows(row1, row2) {
		var t;
		t = this.matrix[row1];
		this.matrix[row1] = this.matrix[row2];
		this.matrix[row2] = t;
	}
    gaussEliminationPart1() {
		var currentRow = 0;
		for (var col = 0; col < this.cols; col++) {
			var nonzero = undefined;
			for (var row = currentRow; row < this.rows; row++) {
				if (!this.matrix[row][col].equalTo(new Fraction(0))) {
					nonzero = row;
					break;
				}
			}
			if (nonzero !== undefined) {
				this.swapRows(nonzero, currentRow);
				this.multiplyRow(currentRow, this.matrix[currentRow][col].invert());
				for (var i = currentRow + 1; i < this.rows; i++) {
					this.substractMultipliedRow(i, currentRow, this.matrix[i][col]);
				}
				currentRow += 1;
			}
		}
	}
	gaussEliminationPart2() {
		for (var row = this.rows - 1; row >= 0; row--) {
			var leading = undefined;
			for (var col = 0; col <= this.cols; col++) {
				if (!this.matrix[row][col].equalTo(new Fraction(0))) {
					leading = col;
					break;
				}
			}
			if (leading !== undefined) {
				for (var i = row - 1; i >= 0; i--) {
					this.substractMultipliedRow(i, row, this.matrix[i][leading]);
				}
			}
		}
	}
	toMathML() {
		var contents = [];
		for (var i = 0; i < this.rows; i++) {
			contents.push([]);
			for (var j = 0; j < this.cols; j++) {
				contents[i].push(this.matrix[i][j].toMathML());
			}
		}
		var table = MathML.table(contents, true, (x) => "center");
		return MathML.row(MathML.brackets(table, "(", ")")); 
	}
}

class SimplexTable {
	constructor(table, objective, basicVariables, startVariables, artificialVariables = [], iteration = 0) {
		this.table = new Matrix(table);
		this.objective = objective;
		this.basicVariables = basicVariables;
		this.startVariables = startVariables;
		this.artificialVariables = artificialVariables;
		this.iteration = iteration;
	}
	B(n) {
		return this.table.matrix[n][this.table.cols-1].copy();
	}
	D(n) {
		return this.table.matrix[this.table.rows-1][n].copy();
	}
	d() {
		return this.table.matrix[this.table.rows-1][this.table.cols-1].copy();
	}
	copy() {
		var bV = [], sV = [], aV = [];
		for (var i = 0; i < this.basicVariables.length; i++) {
			bV.push(this.basicVariables[i]);
		}
		for (var i = 0; i < this.startVariables.length; i++) {
			sV.push(this.startVariables[i]);
		}
		for (var i = 0; i < this.artificialVariables.length; i++) {
			aV.push(this.artificialVariables[i]);
		}
		return (new SimplexTable(this.table.copy().matrix, this.objective.copy(), bV, sV, aV, this.iteration));
	}
	removeColumn(i) {
		this.table.removeColumn(i);
	}
	isPossiblePivot(row, col) {
		var zero = new Fraction(0);
		if (this.D(col).lessThan(zero)) {
			if (zero.lessThan(this.table.matrix[row][col])) {
				for (var i = 0; i < this.table.rows - 1; i++) {
					if (zero.lessThan(this.table.matrix[i][col])) {
						var t1 = this.B(i).divide(this.table.matrix[i][col]);
						var t2 = this.B(row).divide(this.table.matrix[row][col]);
						if (t1.lessThan(t2)) {
							return false;
						}
					}
				}
				return true;
			}
		}
		return false;
	}
	colsWithNegativeD() {
		var cols = [];
		for (var col = 0; col < this.table.cols - 1; col++) {
			if (this.D(col).lessThan(new Fraction(0))) {
				cols.push(col);
			}
		}
		return cols;
	}
	allPossiblePivots() {
		var t = [];
		var cols = this.colsWithNegativeD();
		if (cols.length > 0) {
			for (var row = 0; row < this.table.rows - 1; row++) {
				for (var i = 0; i < cols.length; i++) {
					var col = cols[i];
					if (this.isPossiblePivot(row, col)) {
						t.push([row, col]);
					}
				}
			}
		}
		return t;
	}
	moveToNextIteration(row, col) {
		this.table.multiplyRow(row, this.table.matrix[row][col].invert());
		for (var i = 0; i < this.table.rows; i++) {
			if (i !== row) {
				this.table.substractMultipliedRow(i, row, this.table.matrix[i][col]);
			}
		}
		this.basicVariables[row] = col;
		this.iteration += 1;

	}
	getPlan() {
		var temp = [];
		for (var i = 0; i < this.startVariables.length; i++) {
			var index = this.basicVariables.indexOf(this.startVariables[i]);
			if (index > -1) {
				temp.push(this.B(index));
			} else {
				temp.push(new Fraction(0));
			}
		}
		return temp;
	}
	solution() {
		var temp = this.copy();
		var s = {};
		s["phaseI"] = {};
		s["phaseII"] = {};
		// Phase 1
		s["phaseI"]["rowsToSubstract"] = [];
		for (var i = 0; i < temp.artificialVariables.length; i++) {
			var index = temp.basicVariables.indexOf(temp.artificialVariables[i]);
			if (index > -1) {
				temp.table.substractMultipliedRow(temp.table.rows-1, index);
				s["phaseI"]["rowsToSubstract"].push(index);
			}
		}
		s["phaseI"]["listOfPivots"] = [];
		while (temp.allPossiblePivots().length > 0) {
			var pivot = randomChoice(temp.allPossiblePivots());
			s["phaseI"]["listOfPivots"].push(pivot);
			temp.moveToNextIteration(pivot[0], pivot[1]);
		}
		s["phaseI"]["success"] = (temp.d().lessThan(new Fraction(0)));
		if (temp.d().lessThan(new Fraction(0))) {
			s["phaseI"]["success"] = false;
			return s;
		} else {
			s["phaseI"]["success"] = true;
			s["phaseI"]["resultingPlan"] = temp.getPlan();
		}
		// Phase 2
		s["phaseII"]["columnsToRemove"] = [];
		for (var i = 0; i < temp.table.cols - 1; i++) {
			if (temp.artificialVariables.indexOf(i) > -1) {
				s["phaseII"]["columnsToRemove"].push(i);
			}
		}
		for (var i = temp.artificialVariables.length - 1; i >= 0; i--) {
			temp.removeColumn(temp.artificialVariables[i]);
		}
		
		temp.artificialVariables = [];
		for (var i = 0; i < temp.table.cols; i++) {
			if (i < temp.objective.linexp.coeffs.length) {
				temp.table.matrix[temp.table.rows-1][i] = temp.objective.linexp.coeffs[i].opposite();
			} else {
				temp.table.matrix[temp.table.rows-1][i] = new Fraction(0);
			}
		}
		s["phaseII"]["rowsToSubstract"] = [];
		for (var i = 0; i < temp.table.cols-1; i++) {
			var index = temp.basicVariables.indexOf(i);
			if (index > -1) {
				var k = temp.D(i);
				if (!k.equalTo(new Fraction(0))) {
					temp.table.substractMultipliedRow(temp.table.rows-1, index, k);
					s["phaseII"]["rowsToSubstract"].push([index, k]);
				}
			}
		}
		s["phaseII"]["listOfPivots"] = []
		while (temp.allPossiblePivots().length > 0) {
			var pivot = randomChoice(temp.allPossiblePivots());
			s["phaseII"]["listOfPivots"].push(pivot);
			temp.moveToNextIteration(pivot[0], pivot[1]);
		}
		if (temp.colsWithNegativeD().length > 0) {
			s["phaseII"]["success"] = false;
			return s;
		} else {
			s["phaseII"]["success"] = true;
			s["phaseII"]["resultingPlan"] = temp.getPlan();
			s["phaseII"]["objectiveValue"] = temp.d();
			return s;
		}
	}
	toMathML(row = undefined, col = undefined) {
		var aV = this.artificialVariables;
		var variableNames = function(v) {
			var index = aV.indexOf(v.variable);
			if (index >= 0) {
				var a = new MathML("mi", textNode("A"));
				var i = new MathML("mn", textNode(index + 1));
				return (new MathML("msub", [a, i]));
			} else {
				var a = new MathML("mi", textNode("x"));
				var i = new MathML("mn", textNode(v.variable + 1));
				return (new MathML("msub", [a, i]));
			}
		};
		
		var i, j, mtd;
		var theFirstRow = [];
		var mi = new MathML("mi", textNode("T"));
		var mn = new MathML("mn", textNode(this.iteration));
		var msup = new MathML("msup", [mi, mn]);
		var cell_T = new MathML("mtd", msup, {"style": "border-right: solid; border-bottom: solid;"});
		theFirstRow.push(cell_T);
		for (i = 0; i < this.table.cols - 1; i++) {
			var cell;
			var style = (i === col) ? "border-bottom: solid; background-color: pink;" : "border-bottom: solid;";
			cell = new MathML("mtd", variableNames(new Variable(i)), {"style": style});
			theFirstRow.push(cell);
		}
		mi = new MathML("mi", textNode("b"));
		var cell_b = new MathML("mtd", mi, {"style": "border-bottom: solid; border-left: solid;"});
		theFirstRow.push(cell_b);
		theFirstRow = new MathML("mtr", theFirstRow);
		var rows = [theFirstRow];
		for (i = 0; i < this.table.rows - 1; i++) {
			var t = variableNames(new Variable(this.basicVariables[i]));
			var style = (i === row) ? "border-right: solid; background-color: pink;" : "border-right: solid;";
			var cell_basicVariable = new MathML("mtd", t, {"style": style});
			var thisRow = [cell_basicVariable];
			for (j = 0; j < this.table.cols - 1; j++) {
				if (i === row || j === col) {
					mtd = new MathML("mtd", this.table.matrix[i][j].toMathML(), {"style": "background-color: pink;"});
				} else {
					mtd = new MathML("mtd", this.table.matrix[i][j].toMathML());
				}
				thisRow.push(mtd);
			}
			style = (i === row) ? "border-left: solid; background-color: pink;" : "border-left: solid;";
			mtd = new MathML("mtd", this.B(i).toMathML(), {"style": style});
			thisRow.push(mtd);
			thisRow = new MathML("mtr", thisRow);
			rows.push(thisRow);
		}
		var theLastRow = [];
        var justF = new MathML("mi", textNode("f"));
        justF = new MathML("mtd", justF, {"style": "border-right: solid; border-top: solid;"});
        theLastRow.push(justF);
		for (j = 0; j < this.table.cols - 1; j++) {
			var style = (j === col) ? "border-top: solid; background-color: pink;" : "border-top: solid;";
			var currentCell = new MathML("mtd", this.D(j).toMathML(), {"style": style});
			theLastRow.push(currentCell);
		}
		var lastCell = new MathML("mtd", this.d().toMathML(), {"style": "border-top: solid; border-left: solid;"});
		theLastRow.push(lastCell);
		theLastRow = new MathML("mtr", theLastRow);
		rows.push(theLastRow);
		var center = [];
		for (i = 0; i < this.table.cols; i++) {
			center.push("center");
		}
		center = center.join(" ");
		return (new MathML("mtable", rows, {"columnalign": center}));
	}
}


// Polytope (or simply lots of linear constraints)

class Polytope {
	constructor(constraints, nonnegativeVariables = []) {
		this.constraints = constraints; // nonempty array of LinearConstraint
		this.nonnegativeVariables = nonnegativeVariables; // array
	}
	copy() {
		var t = [], nV = [];
		for (var i = 0; i < this.constraints.length; i++) {
			t.push(this.constraints[i].copy());
		}
		for (var i = 0; i < this.nonnegativeVariables.length; i++) {
			nV.push(this.nonnegativeVariables[i]);
		}
		return (new Polytope(t, nV));
	}
	hasPoint(coords) {
		for (var i = 0; i < this.constraints.length; i++) {
			if (!this.constraints[i].pointSatisfies(coords)) {
				return false;
			}
		}
		for (var i = 0; i < this.nonnegativeVariables.length; i++) {
			if (coords[this.nonnegativeVariables[i]].lessThan(new Fraction(0))) {
				return false;
			}
		}
		return true;
	}
	toMathML() {
		var contents = this.constraints.map((x) => [MathML.row(x.toMathML())]);
		var numberOfVariables = this.constraints[0].linexp.coeffs.length;
		var nonnegativityConstraints = [];		
		if (this.nonnegativeVariables.length > 0) {
			var b = true;
			var nonnegative = [];
			for (i = 0; i < this.nonnegativeVariables.length; i++) {
				if (b) {
					b = false;
				} else {
					nonnegative.push(new MathML("mo", textNode(",")));
				}
				nonnegative = nonnegative.concat(Variable.defaultVariables(new Variable(this.nonnegativeVariables[i])));
			}
			nonnegative.push(new MathML("mo", textNode("\u2265"))); // &ge;
			nonnegative = nonnegative.concat((new Fraction(0)).toMathML());
			contents.push([MathML.row(nonnegative)]);
		}
		var contentsAsMathML = MathML.row(MathML.brackets(MathML.table(contents, false, (i) => "left"), "{", ""));
		return contentsAsMathML;
	}
}

// LinearProgrammingProblem

class LinearProgrammingProblem {
	// constructor(objective, polytope, integerVariables = [], artificialVariables = []) {
		// this.objective = objective;
		// this.polytope = polytope;
		// this.integerVariables = integerVariables.sort();
		// this.artificialVariables = artificialVariables;
	// }
	constructor(objective, constraints, nonnegativeVariables = [], integerVariables = [], artificialVariables = []) {
		this.objective = objective; // LinearObjective
		this.polytope = new Polytope(constraints, nonnegativeVariables); // Polytope
		this.integerVariables = integerVariables.sort();
		this.artificialVariables = artificialVariables;
	}
	copy() {
		var nV = [], iV = [], aV = [];
		for (var i = 0; i < this.polytope.nonnegativeVariables.length; i++) {
			nV.push(this.polytope.nonnegativeVariables[i]);
		}
		for (var i = 0; i < this.integerVariables.length; i++) {
			iV.push(this.integerVariables[i]);
		}
		for (var i = 0; i < this.artificialVariables.length; i++) {
			aV.push(this.artificialVariables[i]);
		}
		return (new LinearProgrammingProblem(this.objective.copy(), this.polytope.copy().constraints, nV, iV, aV));
	}
	alreadyInCanonicalForm() {
		if (!this.objective.maximise) {
			return false;
		}
		for (var i = 0; i < this.objective.linexp.coeffs.length; i++) {
			if (this.polytope.nonnegativeVariables.indexOf(i) < 0) {
				return false;
			}
		}
		for (var i = 0; i < this.polytope.constraints.length; i++) {
			if (this.polytope.constraints[i].sign !== "le") {
				return false;
			}
		}
		return true;
	}
	canonicalForm() {
		var newObjective = (this.objective.maximise) ? this.objective.copy() : this.objective.opposite();
		var newConstraints = [];
		for (var i = 0; i < this.polytope.constraints.length; i++) {
			if (this.polytope.constraints[i].sign === "le") {
				newConstraints.push(this.polytope.constraints[i].copy());
			}
			if (this.polytope.constraints[i].sign === "ge") {
				newConstraints.push(this.polytope.constraints[i].revertSign());
			}
			if (this.polytope.constraints[i].sign === "eq") {
				var pair = this.polytope.constraints[i].equalityIntoTwoInequalities();
				newConstraints.push(pair[0]);
				newConstraints.push(pair[1]);
			}
		}
		var newIntegerVariables = this.integerVariables;
		var transformations = [];
		for (var i = 0; i < this.objective.linexp.coeffs.length; i++) {
			if (this.polytope.nonnegativeVariables.indexOf(i) < 0) {
				var t = [i];
				newObjective = newObjective.replaceVariableWithDifference(i);
				t.push(i);
				t.push(newObjective.linexp.coeffs.length - 1);
				transformations.push(t);
				for (var j = 0; j < newConstraints.length; j++) {
					newConstraints[j] = newConstraints[j].replaceVariableWithDifference(i);
				}
				if (this.integerVariables.indexOf(i) > -1) {
					newIntegerVariables.push(newObjective.linexp.coeffs.length);
				}
			}
		}
		var newNonnegativeVariables = [];
		for (var i = 0; i < newObjective.linexp.coeffs.length; i++) {
			newNonnegativeVariables.push(i);
		}
		var artificialVariables = [];
		for (var i = 0; i < this.artificialVariables.length; i++) {
			artificialVariables.push(this.artificialVariables[i]);
		}
		return [new LinearProgrammingProblem(newObjective, newConstraints, newNonnegativeVariables, newIntegerVariables, artificialVariables), transformations];
	}
	// for Linear Programming Problems without integer variables
	toSimplexTable() {
		var t = this.canonicalForm()[0];
		var matrix = [], artificialVariables = [];
		var numberOfVariables = t.polytope.constraints[0].linexp.coeffs.length;
		var numberOfInequalities = t.polytope.constraints.length;
		var numberOfArtificialVariables = 0;
		for (var i = 0; i < t.polytope.constraints.length; i++) {
			if (t.polytope.constraints[i].b.lessThan(new Fraction(0))) {
				artificialVariables.push(numberOfInequalities + numberOfVariables + numberOfArtificialVariables);
				numberOfArtificialVariables += 1;
			}
		}
		var currentArtificialVariable = 0;
		for (var i = 0; i < numberOfInequalities; i++) {
			var row;
			if (t.polytope.constraints[i].b.lessThan(new Fraction(0))) {
				row = t.polytope.constraints[i].linexp.opposite().coeffs;
			} else {
				row = t.polytope.constraints[i].linexp.copy().coeffs;
			}
			for (var j = 0; j < numberOfInequalities + numberOfArtificialVariables; j++) {
				if (t.polytope.constraints[i].b.lessThan(new Fraction(0))) {
					if (i === j) {
						row.push(new Fraction(-1));
					} else {
						if (j === numberOfInequalities + currentArtificialVariable) {
							row.push(new Fraction(1));
						} else {
							row.push(new Fraction(0));
						}
					}
				} else {
					if (i === j) {
						row.push(new Fraction(1));
					} else {
						row.push(new Fraction(0));
					}
				}
			}
			if (t.polytope.constraints[i].b.lessThan(new Fraction(0))) {
				currentArtificialVariable += 1;
				row.push(t.polytope.constraints[i].b.opposite());
			} else {
				row.push(t.polytope.constraints[i].b);
			}
			matrix.push(row);
		}
		var lastRow = [];
		for (var i = 0; i < numberOfVariables; i++) {
			lastRow.push(new Fraction(0));
		}
		for (var i = 0; i < numberOfInequalities; i++) {
			lastRow.push(new Fraction(0));
		}
		for (var i = 0; i < numberOfArtificialVariables; i++) {
			lastRow.push(new Fraction(1));
		}
		lastRow.push(new Fraction(0));
		matrix.push(lastRow);		
		var basicVariables = [];
		var currentArtificialVariable = 0;
		for (var i = 0; i < numberOfInequalities; i++) {
			if (t.polytope.constraints[i].b.lessThan(new Fraction(0))) {
				basicVariables.push(numberOfVariables + numberOfInequalities + currentArtificialVariable);
				currentArtificialVariable += 1;
			} else {
				basicVariables.push(numberOfVariables + i);
			}
		}
		var startVariables = [];
		for (var i = 0; i < numberOfVariables; i++) {
			startVariables.push(i);
		}
		return (new SimplexTable(matrix, t.objective, basicVariables, startVariables, artificialVariables));
	}
	toMathML() {
		var aV = this.artificialVariables;
		var variableNames = function(v) {
			var index = aV.indexOf(v.variable);
			if (index > -1) {
				var a = new MathML("mi", textNode("A"));
				var i = new MathML("mn", textNode(index + 1));
				return (new MathML("msub", [a, i]));
			} else {
				var a = new MathML("mi", textNode("x"));
				var i = new MathML("mn", textNode(v.variable + 1));
				return (new MathML("msub", [a, i]));
			}
		};
		var i, j;
		var objectiveAsMathML = MathML.row(this.objective.toMathML(variableNames));
		var contents = [];
		var contents = this.polytope.constraints.map((x) => [MathML.row(x.toMathML(variableNames))]);
		var numberOfVariables = this.objective.linexp.coeffs.length;
		var nonnegativityConstraints = [];
		if (this.polytope.nonnegativeVariables.length > 0) {
			var b = true;
			var nonnegative = [];
			for (i = 0; i < this.polytope.nonnegativeVariables.length; i++) {
				if (b) {
					b = false;
				} else {
					nonnegative.push(new MathML("mo", textNode(",")));
				}
				nonnegative = nonnegative.concat(variableNames(new Variable(this.polytope.nonnegativeVariables[i])));
			}
			nonnegative.push(new MathML("mo", textNode("\u2265"))); // &ge;
			nonnegative = nonnegative.concat((new Fraction(0)).toMathML());
			contents.push([MathML.row(nonnegative)]);
		}
		if (this.integerVariables.length > 0) {
			var b = true;
			var integers = [];
			for (i = 0; i < this.integerVariables.length; i++) {
                if (b) {
                    b = false;
                } else {
                    integers.push(new MathML("mo", textNode(",")));
                }
                integers = integers.concat(variableNames(new Variable(this.integerVariables[i])));
            }
            integers.push(new MathML("mo", textNode("\u2208"))); // &isin;
            integers.push(new MathML("mi", textNode("\u2124"), {"mathvariant": "normal"})); // &integers;
			contents.push([MathML.row(integers)]);
		}
		var contentsAsMathML = MathML.row(MathML.brackets(MathML.table(contents, false, (i) => "left"), "{", ""));
		var table = MathML.row(MathML.table([[objectiveAsMathML], [contentsAsMathML]], true, (i) => "left"));
		return table;
	}
	solution(place, language = "en") {
		var paragraph, D;
		paragraph = document.createElement("p");
		paragraph.appendChild(textNode(localization["given_LPP"][language]));
		place.appendChild(paragraph);
		paragraph = document.createElement("p");
		paragraph.appendChild(MathML.done(this.toMathML()));
		place.appendChild(paragraph);
		var canonicalForm, transformations = [];
		var isMinProblem = !this.objective.maximise;
		if (this.alreadyInCanonicalForm()) {
			paragraph = document.createElement("p");
			paragraph.appendChild(textNode(localization["already_canonical_form"][language]));
			place.appendChild(paragraph);
			canonicalForm = this.copy();
		} else {
			var t = this.canonicalForm();
			canonicalForm = t[0];
			transformations = t[1];
			var hasTransformations = (transformations.length > 0);
			if (hasTransformations) {
				paragraph = document.createElement("p");
				paragraph.appendChild(textNode(localization["replacing_variables_without_nonnegativity"][language] + " "));
				for (var i = 0; i < transformations.length; i++) {
					var oldVariable = transformations[i][0], newVariableOne = transformations[i][1], newVariableTwo = transformations[i][2];
					paragraph.appendChild(MathML.done(Variable.defaultVariables(new Variable(oldVariable))));
					paragraph.appendChild(textNode(" " + localization["replaced_with"][language] + " "));
					var difference = new Expression();
					newVariableOne = new Expression(new Variable(newVariableOne));
					difference = difference.add(newVariableOne);
					newVariableTwo = new Expression(new Variable(newVariableTwo));
					difference = difference.add(newVariableTwo.multiply(new Fraction(-1)));
					paragraph.appendChild(MathML.done(MathML.row(difference.toMathML())));
					if (i < transformations.length - 1) {
						paragraph.appendChild(textNode(", "));
					} else {
						paragraph.appendChild(textNode("."));
					}
				}
				place.appendChild(paragraph);
			}
			paragraph = document.createElement("p");
			paragraph.appendChild(textNode(localization["LPP_transformed_into_canonical_form"][language]));
			place.append(paragraph);
			paragraph = document.createElement("p");
			paragraph.appendChild(MathML.done(canonicalForm.toMathML()));
			place.appendChild(paragraph);
		}
		var hasPhaseI = false;
		for (var i = 0; i < canonicalForm.polytope.constraints.length; i++) {
			if (canonicalForm.polytope.constraints[i].b.lessThan(new Fraction(0))) {
				hasPhaseI = true;
			}
		}
		var simplexTable = this.toSimplexTable();
		var solution = simplexTable.solution();
		if (hasPhaseI) {
			paragraph = document.createElement("p");
			paragraph.appendChild(textNode(localization["Auxiliary_problem_has_to_be_solved"][language]));
			place.appendChild(paragraph);
			paragraph = document.createElement("p");
			paragraph.appendChild(MathML.done(simplexTable.toMathML()));
			place.appendChild(paragraph);
			paragraph = document.createElement("p");
			paragraph.appendChild(textNode(localization["Preparation_of_table_of_auxiliary_problem"][language]));
			place.appendChild(paragraph);
			paragraph = document.createElement("p");
			var rowsToSubstract = solution["phaseI"]["rowsToSubstract"];
			if (rowsToSubstract.length === 1) {
				paragraph.appendChild(textNode(localization["One_row_to_substract_(auxiliary_problem)"][language](rowsToSubstract[0])));
			} else {
				paragraph.appendChild(textNode(localization["Multiple_rows_to_substract_(auxiliary_problem)"][language](rowsToSubstract)));
			}
			for (var i = 0; i < solution["phaseI"]["rowsToSubstract"].length; i++) {
				simplexTable.table.substractMultipliedRow(simplexTable.table.rows-1, solution["phaseI"]["rowsToSubstract"][i]);
			}
			place.appendChild(paragraph);
			paragraph = document.createElement("p");
			paragraph.appendChild(MathML.done(simplexTable.toMathML()));
			place.appendChild(paragraph);
			paragraph = document.createElement("p");;
			paragraph.appendChild(textNode(localization["start_iterations_(auxiliary_problem)"][language]));
			place.appendChild(paragraph);
			var listOfPivots = solution["phaseI"]["listOfPivots"];
			for (var i = 0; i < listOfPivots.length; i++) {
				var row = listOfPivots[i][0];
				var col = listOfPivots[i][1];
				paragraph = document.createElement("p");
				paragraph.appendChild(MathML.done(simplexTable.toMathML(row, col)));
				place.appendChild(paragraph);
				simplexTable.moveToNextIteration(row, col);
			}
			paragraph = document.createElement("p");
			paragraph.appendChild(textNode(localization["resulting_table"][language]));
			place.appendChild(paragraph);
			paragraph = document.createElement("p");
			paragraph.appendChild(MathML.done(simplexTable.toMathML()));
			place.appendChild(paragraph);
			if (solution["phaseI"]["success"]) {
				paragraph = document.createElement("p");
				paragraph.appendChild(textNode(localization["feasible_plan_found"][language]));
				place.appendChild(paragraph);
				paragraph = document.createElement("p");
				paragraph.appendChild(textNode(localization["remove_columns_of_artificial_variables"][language]));
				place.appendChild(paragraph);
				var columnsToRemove = solution["phaseII"]["columnsToRemove"];
				for (var i = columnsToRemove.length - 1; i >= 0; i--) {
					simplexTable.removeColumn(columnsToRemove[i]);
				}
				paragraph = document.createElement("p");
				paragraph.appendChild(MathML.done(simplexTable.toMathML()));
				place.appendChild(paragraph);
				paragraph = document.createElement("p");
				paragraph.appendChild(textNode(localization["last_row_according_to_objective"][language]));
				place.appendChild(paragraph);
				for (var i = 0; i < simplexTable.table.cols; i++) {
					if (i < simplexTable.objective.linexp.coeffs.length) {
						simplexTable.table.matrix[simplexTable.table.rows-1][i] = simplexTable.objective.linexp.coeffs[i].opposite();
					} else {
						simplexTable.table.matrix[simplexTable.table.rows-1][i] = new Fraction(0);
					}
				}
				paragraph = document.createElement("p");
				paragraph.appendChild(MathML.done(simplexTable.toMathML()));
				place.appendChild(paragraph);
				paragraph = document.createElement("p");
				paragraph.appendChild(textNode(localization["Preparation_of_table_of_main_problem"][language]));
				place.appendChild(paragraph);
				for (var i = 0; i < solution["phaseII"]["rowsToSubstract"].length; i++) {
					var r = solution["phaseII"]["rowsToSubstract"][i][0];
					var k = solution["phaseII"]["rowsToSubstract"][i][1];
					paragraph = document.createElement("p");
					paragraph.appendChild(textNode(localization["substract_multiplied_row"][language](r)));
					paragraph.appendChild(MathML.done(MathML.row(k.toMathML())));
					paragraph.appendChild(textNode("."));
					place.appendChild(paragraph);
					simplexTable.table.substractMultipliedRow(simplexTable.table.rows-1, r, k);
				}
			} else {
				paragraph = document.createElement("p");
				paragraph.appendChild(textNode(localization["set_of_plans_is_empty"][language]));
				place.appendChild(paragraph);
				return;
			}
		} else {
			for (var i = 0; i < simplexTable.table.cols; i++) {
				if (i < simplexTable.objective.linexp.coeffs.length) {
					simplexTable.table.matrix[simplexTable.table.rows-1][i] = simplexTable.objective.linexp.coeffs[i].opposite();
				} else {
					simplexTable.table.matrix[simplexTable.table.rows-1][i] = new Fraction(0);
				}
			}
		}
		paragraph = document.createElement("p");
		paragraph.appendChild(textNode(localization["resulting_table"][language]));
		place.appendChild(paragraph);
		paragraph = document.createElement("p");
		paragraph.appendChild(MathML.done(simplexTable.toMathML()));
		place.appendChild(paragraph);
		paragraph = document.createElement("p");
		paragraph.appendChild(textNode(localization["start_iterations"][language]));
		place.appendChild(paragraph);
		simplexTable.iteration = 0;
		var allCurrentPlans = [];
		for (var i = 0; i < solution["phaseII"]["listOfPivots"].length; i++) {
			var row = solution["phaseII"]["listOfPivots"][i][0];
			var col = solution["phaseII"]["listOfPivots"][i][1];
			paragraph = document.createElement("p");
			paragraph.appendChild(MathML.done(simplexTable.toMathML(row, col)));
			place.appendChild(paragraph);
			allCurrentPlans.push(simplexTable.getPlan());
			simplexTable.moveToNextIteration(row, col);
		}
		allCurrentPlans.push(simplexTable.getPlan());
		paragraph = document.createElement("p");
		paragraph.appendChild(textNode(localization["resulting_table"][language]));
		place.appendChild(paragraph);
		paragraph = document.createElement("p");
		paragraph.appendChild(MathML.done(simplexTable.toMathML()));
		place.appendChild(paragraph);
		if (solution["phaseII"]["success"]) {
			paragraph = document.createElement("p");
			paragraph.appendChild(textNode(localization["phase_II_success_part_1"][language]));
			paragraph.appendChild(MathML.done(MathML.row(solution["phaseII"]["objectiveValue"].toMathML())));
			paragraph.appendChild(textNode(localization["phase_II_success_part_2"][language]));
			var optimalPlan = solution["phaseII"]["resultingPlan"];
			var t1 = [], t2 = [];
			for (var i = 0; i < optimalPlan.length; i++) {
				t1 = t1.concat(Variable.defaultVariables(new Variable(i)));
				t2 = t2.concat(optimalPlan[i].toMathML());
				if (i < optimalPlan.length - 1) {
					t1.push(new MathML("mo", textNode(",")));
					t2.push(new MathML("mo", textNode(",")));
				}
			}
			var t = MathML.brackets(t1, "(", ")");
			t.push(new MathML("mo", textNode("=")));
			t = t.concat(MathML.brackets(t2, "(", ")"));
			paragraph.appendChild(MathML.done(MathML.row(t)));
			paragraph.appendChild(textNode("."));
			place.appendChild(paragraph);
			if (isMinProblem) {
				paragraph = document.createElement("p");
				paragraph.appendChild(textNode(localization["original_LPP_min"][language]));
				paragraph.appendChild(MathML.done(MathML.row(solution["phaseII"]["objectiveValue"].opposite().toMathML())));
				paragraph.appendChild(textNode("."));
				place.appendChild(paragraph);
			}
			if (hasTransformations) {
				paragraph = document.createElement("p");
				paragraph.appendChild(textNode(localization["original_LPP_has_variables_without_nonnegativity"][language]));
				place.appendChild(paragraph);
				var plans = [];
				
				for (var i = 0; i < allCurrentPlans.length; i++) {
					for (var j = 0; j < transformations.length; j++) {
						var oldVariable = transformations[j][0], newVariableOne = transformations[j][1], newVariableTwo = transformations[j][2];
						var value = allCurrentPlans[i][newVariableOne].substract(allCurrentPlans[i][newVariableTwo]);
						allCurrentPlans[i][newVariableOne] = value;
						allCurrentPlans[i][newVariableTwo] = undefined;
					}
					plans.push([]);
					for (var j = 0; j < allCurrentPlans[i].length; j++) {
						if (allCurrentPlans[i][j] !== undefined) {
							plans[i].push(allCurrentPlans[i][j]);
						}
					}
				}
				allCurrentPlans = plans;
				for (var i = 0; i < transformations.length; i++) {
					var oldVariable = transformations[i][0], newVariableOne = transformations[i][1], newVariableTwo = transformations[i][2];
					paragraph = document.createElement("p");
					paragraph.appendChild(textNode(localization["value_of_variable_1"][language]));
					paragraph.appendChild(MathML.done(Variable.defaultVariables(new Variable(oldVariable))));
					paragraph.appendChild(textNode(localization["value_of_variable_2"][language]));
					var difference = new Expression();
					var t1 = new Expression(new Variable(newVariableOne));
					difference = difference.add(t1);
					var t2 = new Expression(new Variable(newVariableTwo));
					difference = difference.add(t2.multiply(new Fraction(-1)));
					var math = difference.toMathML();
					math.push(new MathML("mo", textNode("=")));
					var value = optimalPlan[newVariableOne].substract(optimalPlan[newVariableTwo]);
					optimalPlan[newVariableOne] = value;
					optimalPlan[newVariableTwo] = undefined;
					math = math.concat(value.toMathML());
					paragraph.appendChild(MathML.done(MathML.row(math)));
					place.appendChild(paragraph);
				}
				var newOptimalPlan = []
				for (var i = 0; i < optimalPlan.length; i++) {
					if (optimalPlan[i] !== undefined) {
						newOptimalPlan.push(optimalPlan[i])
					}
				}
				var t1 = [], t2 = [];
				for (var i = 0; i < newOptimalPlan.length; i++) {
					t1 = t1.concat(Variable.defaultVariables(new Variable(i)));
					t2 = t2.concat(newOptimalPlan[i].toMathML());
					if (i < newOptimalPlan.length - 1) {
						t1.push(new MathML("mo", textNode(",")));
						t2.push(new MathML("mo", textNode(",")));
					}
				}
				var t = MathML.brackets(t1, "(", ")");
				t.push(new MathML("mo", textNode("=")));
				t = t.concat(MathML.brackets(t2, "(", ")"));
				paragraph = document.createElement("p");
				paragraph.appendChild(textNode(localization["the_optimal_plan"][language]));
				paragraph.appendChild(MathML.done(MathML.row(t)));
				paragraph.appendChild(textNode("."));
				place.appendChild(paragraph);	
			}
			if (!hasTransformations & this.objective.linexp.coeffs.length === 2)
				this.draw(place, allCurrentPlans);
		} else {
			paragraph = document.createElement("p");
			paragraph.appendChild(textNode(localization["unbounded_objective"][language]));
			place.appendChild(paragraph);
		}
	}
	static calculator(place, language = "en") {
		var inputFields = {};
		var buttons = {};
		var D = {};
		var paragraph = document.createElement("p");
		paragraph.appendChild(textNode(localization["number_of_variables"][language] + ": "));
		inputFields["numberOfVariables"] = document.createElement("input");
		inputFields["numberOfVariables"].type = "text";
		inputFields["numberOfVariables"].size = 2;
		paragraph.appendChild(inputFields["numberOfVariables"]);
		paragraph.appendChild(textNode(" " + localization["number_of_linear_constraints"][language] + ": "));
		inputFields["numberOfInequalities"] = document.createElement("input");
		inputFields["numberOfInequalities"].type = "text";
		inputFields["numberOfInequalities"].size = 2;
		paragraph.appendChild(inputFields["numberOfInequalities"]);
		paragraph.appendChild(textNode(" "));
		buttons["start"] = document.createElement("button");
		buttons["start"].textContent = "OK";
		paragraph.appendChild(buttons["start"]);
		place.appendChild(paragraph);
		buttons["start"].onclick = function() {
			var numberOfVariables = parseInt(inputFields["numberOfVariables"].value);
			var numberOfInequalities = parseInt(inputFields["numberOfInequalities"].value);
			if (isNaN(numberOfVariables) || isNaN(numberOfInequalities)) {
				alert(localization["enter_integers_bigger_than_zero"][language]);
				return;
			}
			if (numberOfVariables < 1 || numberOfInequalities < 1) {
				alert(localization["enter_integers_bigger_than_zero"][language]);
				return;
			}
			inputFields["numberOfVariables"].disabled = true;
			inputFields["numberOfInequalities"].disabled = true;
			buttons["start"].disabled = true;
			paragraph = document.createElement("p");
			paragraph.appendChild(textNode(localization["choose_max_or_min"][language] + ": "));
			inputFields["maxOrMin"] = document.createElement("select");
			var options = ["max", "min"];
			for (var i = 0; i < options.length; i++) {
				var op = document.createElement("option");
				op.value = options[i];
				op.text = options[i];
				inputFields["maxOrMin"].appendChild(op);
			}
			paragraph.appendChild(inputFields["maxOrMin"]);
			place.appendChild(paragraph);
			paragraph = document.createElement("p");
			paragraph.appendChild(textNode(localization["enter_the_objective_function"][language]));
			place.appendChild(paragraph);
			paragraph = document.createElement("p");
			inputFields["objective"] = [];
			for (var i = 0; i < numberOfVariables; i++) {
				var c = document.createElement("input");
				c.type = "text";
				c.size = 6;
				paragraph.appendChild(c);
				paragraph.appendChild(textNode(" "));
				inputFields["objective"].push(c);
			}
			place.appendChild(paragraph);
			paragraph = document.createElement("p");
			paragraph.appendChild(textNode(localization["enter_constraints"][language]));
			place.appendChild(paragraph);
			inputFields["constraints"] = [];
			for (var i = 0; i < numberOfInequalities; i++) {
				var o = {};
				var t = [];
				paragraph = document.createElement("p");
				for (var j = 0; j < numberOfVariables; j++) {
					var c = document.createElement("input");
					c.type = "text";
					c.size = 6;
					paragraph.appendChild(c);
					paragraph.appendChild(textNode(" "));
					t.push(c);
				}
				o["coeffs"] = t;
				o["sign"] = document.createElement("select");
				options = ["<=", "=", ">="];
				for (var k = 0; k < options.length; k++) {
					var op = document.createElement("option");
					op.value = options[k];
					op.text = options[k];
					o["sign"].appendChild(op);
				}
				var b = document.createElement("input");
				b.type = "text";
				b.size = 6;
				o["B"] = b;
				paragraph.appendChild(o["sign"]);
				paragraph.appendChild(textNode(" "));
				paragraph.appendChild(b);
				inputFields["constraints"].push(o);
				place.appendChild(paragraph);
			}
			paragraph = document.createElement("p");
			paragraph.appendChild(textNode(localization["enter_nonnegative_variables"][language]));
			place.appendChild(paragraph);
			paragraph = document.createElement("p");
			inputFields["nonnegativeVariables"] = document.createElement("input");
			inputFields["nonnegativeVariables"].type = "text";
			inputFields["nonnegativeVariables"].size = 6;
			paragraph.appendChild(inputFields["nonnegativeVariables"]);
			place.appendChild(paragraph);
			paragraph = document.createElement("p");
			buttons["final"] = document.createElement("button");
			buttons["final"].textContent = "OK";
			paragraph.appendChild(buttons["final"]);
			place.appendChild(paragraph);
			buttons["final"].onclick = function() {
				var maximise = (inputFields["maxOrMin"].value === "max");
				var coeffs = [];
				for (var i = 0; i < numberOfVariables; i++) {
					var fraction = Fraction.parse(inputFields["objective"][i].value);
					if (fraction === undefined) {
						alert(localization["wrong_coefficient_of_the_objective"][language]((i+1).toString()));
						return;
					}
					coeffs.push(fraction);
				}
				var objective = new LinearObjective(new LinearExpression(coeffs), maximise);
				var constraints = [];
				for (var i = 0; i < numberOfInequalities; i++) {
					var coeffs = [];
					for (var j = 0; j < numberOfVariables; j++) {
						var fraction = Fraction.parse(inputFields["constraints"][i]["coeffs"][j].value);
						if (fraction === undefined) {
							alert(localization["wrong_coefficient_of_constraint"][language]((i+1).toString(), (j+1).toString()));
							return;
						}
						coeffs.push(fraction);
					}
					var index = ["<=", "=", ">="].indexOf(inputFields["constraints"][i]["sign"].value);
					var sign = ["le", "eq", "ge"][index];
					var fraction = Fraction.parse(inputFields["constraints"][i]["B"].value);
					if (fraction === undefined) {
						alert(localization["wrong_constant_of_constraint"][language]((i+1).toString()));
						return;
					}
					constraints.push(new LinearConstraint(new LinearExpression(coeffs), fraction, sign));
				}
				var nonnegativeVariables = [];
				var indexes = inputFields["nonnegativeVariables"].value.split(" ");
				for (var i = 0; i < indexes.length; i++) {
					if (indexes[i] !== "") {
						var index = parseInt(indexes[i]);
						if (isNaN(index)) {
							alert(localization["error_in_the_nonnegative_list"][language]);
							return;
						} else {
							if (index < 1) {
								alert(localization["index_less_than_1"][language]);
								return;
							}
							if (index > numberOfVariables) {
								alert(localization["index_bigger_than_number_of_variables"][language](numberOfVariables.toString()));
								return;
							}
							if (nonnegativeVariables.indexOf(index - 1) < 0) {
								nonnegativeVariables.push(index - 1);
							}
						}
					}
				}
				nonnegativeVariables.sort();
				var LPP = new LinearProgrammingProblem(objective, constraints, nonnegativeVariables);
				inputFields["maxOrMin"].disabled = true;
				for (var i = 0; i < numberOfVariables; i++) {
					inputFields["objective"][i].disabled = true;
				}
				for (var i = 0; i < numberOfInequalities; i++) {
					for (var j = 0; j < numberOfVariables; j++) {
						inputFields["constraints"][i]["coeffs"][j].disabled = true;
					}
					inputFields["constraints"][i]["sign"].disabled = true;
					inputFields["constraints"][i]["B"].disabled = true;
				}
				inputFields["nonnegativeVariables"].disabled = true;
				buttons["final"].disabled = true;
				LPP.solution(place, language);
			}
		}
	}
	
	static calculatorWithDrawing(place, language = "en") {
		var inputFields = {};
		var buttons = {};
		var D = {};
		var paragraph = document.createElement("p");
		paragraph.appendChild(textNode(localization["number_of_variables"][language] + ": "));
		inputFields["numberOfVariables"] = document.createElement("input");
		inputFields["numberOfVariables"].type = "text";
		inputFields["numberOfVariables"].size = 2;
		inputFields["numberOfVariables"].value = 2;
		inputFields["numberOfVariables"].disabled = true;
		paragraph.appendChild(inputFields["numberOfVariables"]);
		paragraph.appendChild(textNode(" " + localization["number_of_linear_constraints"][language] + ": "));
		inputFields["numberOfInequalities"] = document.createElement("input");
		inputFields["numberOfInequalities"].type = "text";
		inputFields["numberOfInequalities"].size = 2;
		paragraph.appendChild(inputFields["numberOfInequalities"]);
		paragraph.appendChild(textNode(" "));
		buttons["start"] = document.createElement("button");
		buttons["start"].textContent = "OK";
		paragraph.appendChild(buttons["start"]);
		place.appendChild(paragraph);
		buttons["start"].onclick = function() {
			var numberOfVariables = parseInt(inputFields["numberOfVariables"].value);
			var numberOfInequalities = parseInt(inputFields["numberOfInequalities"].value);
			if (isNaN(numberOfVariables) || isNaN(numberOfInequalities)) {
				alert(localization["enter_integers_bigger_than_zero"][language]);
				return;
			}
			if (numberOfVariables < 1 || numberOfInequalities < 1) {
				alert(localization["enter_integers_bigger_than_zero"][language]);
				return;
			}
			inputFields["numberOfVariables"].disabled = true;
			inputFields["numberOfInequalities"].disabled = true;
			buttons["start"].disabled = true;
			paragraph = document.createElement("p");
			paragraph.appendChild(textNode(localization["choose_max_or_min"][language] + ": "));
			inputFields["maxOrMin"] = document.createElement("select");
			var options = ["max", "min"];
			for (var i = 0; i < options.length; i++) {
				var op = document.createElement("option");
				op.value = options[i];
				op.text = options[i];
				inputFields["maxOrMin"].appendChild(op);
			}
			paragraph.appendChild(inputFields["maxOrMin"]);
			place.appendChild(paragraph);
			paragraph = document.createElement("p");
			paragraph.appendChild(textNode(localization["enter_the_objective_function"][language]));
			place.appendChild(paragraph);
			paragraph = document.createElement("p");
			inputFields["objective"] = [];
			for (var i = 0; i < numberOfVariables; i++) {
				var c = document.createElement("input");
				c.type = "text";
				c.size = 6;
				paragraph.appendChild(c);
				paragraph.appendChild(textNode(" "));
				inputFields["objective"].push(c);
			}
			place.appendChild(paragraph);
			paragraph = document.createElement("p");
			paragraph.appendChild(textNode(localization["enter_constraints"][language]));
			place.appendChild(paragraph);
			inputFields["constraints"] = [];
			for (var i = 0; i < numberOfInequalities; i++) {
				var o = {};
				var t = [];
				paragraph = document.createElement("p");
				for (var j = 0; j < numberOfVariables; j++) {
					var c = document.createElement("input");
					c.type = "text";
					c.size = 6;
					paragraph.appendChild(c);
					paragraph.appendChild(textNode(" "));
					t.push(c);
				}
				o["coeffs"] = t;
				o["sign"] = document.createElement("select");
				options = ["<=", "=", ">="];
				for (var k = 0; k < options.length; k++) {
					var op = document.createElement("option");
					op.value = options[k];
					op.text = options[k];
					o["sign"].appendChild(op);
				}
				var b = document.createElement("input");
				b.type = "text";
				b.size = 6;
				o["B"] = b;
				paragraph.appendChild(o["sign"]);
				paragraph.appendChild(textNode(" "));
				paragraph.appendChild(b);
				inputFields["constraints"].push(o);
				place.appendChild(paragraph);
			}
			paragraph = document.createElement("p");
			paragraph.appendChild(textNode(localization["enter_nonnegative_variables"][language]));
			place.appendChild(paragraph);
			paragraph = document.createElement("p");
			inputFields["nonnegativeVariables"] = document.createElement("input");
			inputFields["nonnegativeVariables"].type = "text";
			inputFields["nonnegativeVariables"].size = 6;
			paragraph.appendChild(inputFields["nonnegativeVariables"]);
			place.appendChild(paragraph);
			paragraph = document.createElement("p");
			buttons["final"] = document.createElement("button");
			buttons["final"].textContent = "OK";
			paragraph.appendChild(buttons["final"]);
			place.appendChild(paragraph);
			buttons["final"].onclick = function() {
				var maximise = (inputFields["maxOrMin"].value === "max");
				var coeffs = [];
				for (var i = 0; i < numberOfVariables; i++) {
					var fraction = Fraction.parse(inputFields["objective"][i].value);
					if (fraction === undefined) {
						alert(localization["wrong_coefficient_of_the_objective"][language]((i+1).toString()));
						return;
					}
					coeffs.push(fraction);
				}
				var objective = new LinearObjective(new LinearExpression(coeffs), maximise);
				var constraints = [];
				for (var i = 0; i < numberOfInequalities; i++) {
					var coeffs = [];
					for (var j = 0; j < numberOfVariables; j++) {
						var fraction = Fraction.parse(inputFields["constraints"][i]["coeffs"][j].value);
						if (fraction === undefined) {
							alert(localization["wrong_coefficient_of_constraint"][language]((i+1).toString(), (j+1).toString()));
							return;
						}
						coeffs.push(fraction);
					}
					var index = ["<=", "=", ">="].indexOf(inputFields["constraints"][i]["sign"].value);
					var sign = ["le", "eq", "ge"][index];
					var fraction = Fraction.parse(inputFields["constraints"][i]["B"].value);
					if (fraction === undefined) {
						alert(localization["wrong_constant_of_constraint"][language]((i+1).toString()));
						return;
					}
					constraints.push(new LinearConstraint(new LinearExpression(coeffs), fraction, sign));
				}
				var nonnegativeVariables = [];
				var indexes = inputFields["nonnegativeVariables"].value.split(" ");
				for (var i = 0; i < indexes.length; i++) {
					if (indexes[i] !== "") {
						var index = parseInt(indexes[i]);
						if (isNaN(index)) {
							alert(localization["error_in_the_nonnegative_list"][language]);
							return;
						} else {
							if (index < 1) {
								alert(localization["index_less_than_1"][language]);
								return;
							}
							if (index > numberOfVariables) {
								alert(localization["index_bigger_than_number_of_variables"][language](numberOfVariables.toString()));
								return;
							}
							if (nonnegativeVariables.indexOf(index - 1) < 0) {
								nonnegativeVariables.push(index - 1);
							}
						}
					}
				}
				nonnegativeVariables.sort();
				var LPP = new LinearProgrammingProblem(objective, constraints, nonnegativeVariables);
				inputFields["maxOrMin"].disabled = true;
				for (var i = 0; i < numberOfVariables; i++) {
					inputFields["objective"][i].disabled = true;
				}
				for (var i = 0; i < numberOfInequalities; i++) {
					for (var j = 0; j < numberOfVariables; j++) {
						inputFields["constraints"][i]["coeffs"][j].disabled = true;
					}
					inputFields["constraints"][i]["sign"].disabled = true;
					inputFields["constraints"][i]["B"].disabled = true;
				}
				inputFields["nonnegativeVariables"].disabled = true;
				buttons["final"].disabled = true;
				LPP.draw(place);
			}
		}
	}
		
}

// 2d polytopes and 2d linear programming

function unitVector(numberOfDimensions, i) {
	var t = [];
	for (var j = 0; j < numberOfDimensions; j++) {
		if (j === i) {
			t.push(new Fraction(1));
		} else {
			t.push(new Fraction(0));
		}
	}
	return t;
}

Polytope.prototype.information = function() {
	var info = {}, t = [];
	var numberOfVariables = this.constraints[0].linexp.coeffs.length;
	for (var i = 0; i < numberOfVariables; i++) {
		t.push(new Fraction(0));
	}
	var objective = new LinearObjective(new LinearExpression(t));
	var problem = new LinearProgrammingProblem(objective, this.constraints, this.nonnegativeVariables);
	var solution = problem.toSimplexTable().solution();
	if (solution["phaseI"]["success"]) {
		info["nonempty"] = true;
		info["bounded"] = true;
		
		info["boundaries"] = [];
		for (var i = 0; i < numberOfVariables; i++) {
			t = [];
			var linexp = new LinearExpression(unitVector(numberOfVariables, i));
			objective = new LinearObjective(linexp, false);
			problem = new LinearProgrammingProblem(objective, this.constraints, this.nonnegativeVariables);
			solution = problem.toSimplexTable().solution();
			if (solution["phaseII"]["success"]) {
				t.push(solution["phaseII"]["objectiveValue"].opposite());
			} else {
				t.push(undefined);
				info["bounded"] = false;
			}			
			objective = new LinearObjective(linexp);
			problem = new LinearProgrammingProblem(objective, this.constraints, this.nonnegativeVariables);
			solution = problem.toSimplexTable().solution();
			if (solution["phaseII"]["success"]) {
				t.push(solution["phaseII"]["objectiveValue"]);
			} else {
				t.push(undefined);
				info["bounded"] = false;
			}
			info["boundaries"].push(t);
			info["vertices"] = this.allVertices();
		}
		return info;
	} else {
		info["nonempty"] = false;
		return info;
	}
}


function vectorSubstract(a, b) {
	return [a[0].substract(b[0]), a[1].substract(b[1])];
}
function vectorSquared(a) {
	return a[0].multiply(a[0]).add(a[1].multiply(a[1]));
}

function compareVectors(v1, v2) {
	var det = v1[0].multiply(v2[1]).substract(v1[1].multiply(v2[0]));
	var zero = new Fraction(0);
	if (det.lessThan(zero)) {
		return 1;
	}
	if (zero.lessThan(det)) {
		return -1;
	}
	var s1 = vectorSquared(v1);
	var s2 = vectorSquared(v2);
	if (s2.lessThan(s1))
		return 1
	if (s1.lessThan(s2))
		return -1
	return 0;
}

function sortPoints(arrayOfPoints) {
	if (arrayOfPoints.length > 0) {
		var t = [arrayOfPoints[0][0], arrayOfPoints[0][1]];
		arrayOfPoints.sort((v1, v2) => compareVectors(vectorSubstract(v1, t), vectorSubstract(v2, t)));
	}
}

Polytope.prototype.allVertices = function() {
	var constraints = this.copy().constraints;
	if (this.nonnegativeVariables.indexOf(0) > -1) {
		constraints.push(new LinearConstraint(new LinearExpression([new Fraction(1), new Fraction(0)]), new Fraction(0), "ge"));
	}
	if (this.nonnegativeVariables.indexOf(1) > -1) {
		constraints.push(new LinearConstraint(new LinearExpression([new Fraction(0), new Fraction(1)]), new Fraction(0), "ge"));
	}
	var vertices = [];
	for (var i = 0; i < constraints.length; i++) {
		for (var j = i + 1; j < constraints.length; j++) {
			var intersectionPoint = constraints[i].intersection(constraints[j]);
			if (intersectionPoint !== undefined) {
				if (this.hasPoint(intersectionPoint)) {
					vertices.push(intersectionPoint);
				}
			}
		}
	}
	sortPoints(vertices);
	var verticesWithoutRepetitions = [];
	for (var i = 0; i < vertices.length; i++) {
		var v1 = vertices[i];
		var v2 = vertices[(i+1)%vertices.length];
		if (!v1[0].equalTo(v2[0]) || !v1[1].equalTo(v2[1])) {
			verticesWithoutRepetitions.push(v1);
		}
	}
	return verticesWithoutRepetitions;
}

function fractionToDecimal(f) {
	return (Number(f.numer * 1000000n / f.denom)/1000000);
}

Polytope.prototype.drawIfBounded = function(svg, bx1, bx2, by1, by2, scale, plans = undefined) {
	var zero = new Fraction(0), half = new Fraction(1, 2), unit = new Fraction(1);
	var info = this.information();
	if (!info["bounded"])
		throw new Error("The polytope isn't bounded!");
	
	var x1 = info["boundaries"][0][0], x2 = info["boundaries"][0][1];
	var y1 = info["boundaries"][1][0], y2 = info["boundaries"][1][1];
	var width = bx2.substract(bx1).add(unit).multiply(scale);
	var height = by2.substract(by1).add(unit).multiply(scale);

	var verticesAsFractions = info["vertices"];
	vertices = verticesAsFractions.map(x => [x[0].substract(bx1).add(half).multiply(scale), height.substract(x[1].substract(by1).add(half).multiply(scale))]);
	vertices = vertices.map(x => [fractionToDecimal(x[0]), fractionToDecimal(x[1])]);
	
	var polygon = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
	var points = "";
	for (var i = 0; i < vertices.length; i++) {
		points += vertices[i][0].toString() + "," + vertices[i][1].toString() + " ";
	}
	polygon.setAttribute("points", points);
	polygon.setAttribute("fill", "lime");
	polygon.setAttribute("fill-opacity", "75%");
	polygon.setAttribute("stroke", "green");
	polygon.setAttribute("stroke-width", "2");
	svg.appendChild(polygon);

	if (plans !== undefined) {
		for (var i = 0; i < plans.length - 1; i++) {
			var x1 = plans[i][0], y1 = plans[i][1], x2 = plans[i+1][0], y2 = plans[i+1][1];
			x1 = fractionToDecimal(x1.substract(bx1).add(half).multiply(scale));
			x2 = fractionToDecimal(x2.substract(bx1).add(half).multiply(scale));
			y1 = fractionToDecimal(height.substract(y1.substract(by1).add(half).multiply(scale)));
			y2 = fractionToDecimal(height.substract(y2.substract(by1).add(half).multiply(scale)));
			var arrow = document.createElementNS("http://www.w3.org/2000/svg", "line");
			arrow.setAttribute("x1", x1);
			arrow.setAttribute("y1", y1);
			arrow.setAttribute("x2", x2);
			arrow.setAttribute("y2", y2);
			arrow.setAttribute("marker-end", "url(#arrowhead)");
			arrow.setAttribute("stroke", "green");
			arrow.setAttribute("stroke-width", "1.5");
			svg.appendChild(arrow);
		}
	}
			
	for (var i = 0; i < vertices.length; i++) {
		var dot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
		dot.setAttribute("cx", vertices[i][0]);
		dot.setAttribute("cy", vertices[i][1]);
		dot.setAttribute("r", 4);
		dot.setAttribute("fill", "red");
		let s = "(" + verticesAsFractions[i][0].toString() + "; " + verticesAsFractions[i][1].toString() + ")";
		var title = document.createElementNS("http://www.w3.org/2000/svg", "title");
		title.appendChild(textNode(s));
		dot.appendChild(title);
		svg.appendChild(dot);
	}
}

function drawAxisEtc(svg, x1, x2, y1, y2, scale) {
	var zero = new Fraction(0), half = new Fraction(1, 2), unit = new Fraction(1);
	var width = x2.substract(x1).add(unit).multiply(scale);
	var height = y2.substract(y1).add(unit).multiply(scale);

	var axisY = document.createElementNS("http://www.w3.org/2000/svg", "line");
	axisY.setAttribute("x1", fractionToDecimal(half.substract(x1).multiply(scale)));
	axisY.setAttribute("y1", fractionToDecimal(zero));
	axisY.setAttribute("x2", fractionToDecimal(half.substract(x1).multiply(scale)));
	axisY.setAttribute("y2", fractionToDecimal(height));
	axisY.setAttribute("stroke", "black");
	svg.appendChild(axisY);
	
	var leastIntegerX = x1.substract(half).ceiling(), largestIntegerX = x2.add(half).floor();
	var leastIntegerY = y1.substract(half).ceiling(), largestIntegerY = y2.add(half).floor();
	for (var i = leastIntegerX; i <= largestIntegerX; i += 1n) {
		var verticalLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
		var t = half.substract(x1).add(new Fraction(i)).multiply(scale);
		verticalLine.setAttribute("x1", fractionToDecimal(t));
		verticalLine.setAttribute("y1", fractionToDecimal(zero));
		verticalLine.setAttribute("x2", fractionToDecimal(t));
		verticalLine.setAttribute("y2", fractionToDecimal(height));
		if (i === 0n) {
			verticalLine.setAttribute("stroke", "black");
		} else {
			verticalLine.setAttribute("stroke", "gray");
			verticalLine.setAttribute("stroke-dasharray", "4");
		}
		svg.appendChild(verticalLine);
		var textInSvg = document.createElementNS("http://www.w3.org/2000/svg", "text");
		textInSvg.setAttribute("x", fractionToDecimal(half.substract(x1).add(new Fraction(i)).add(new Fraction(1, 10)).multiply(scale)));
		textInSvg.setAttribute("y", fractionToDecimal(height.substract(half.substract(y1).add(new Fraction(1, 10)).multiply(scale))));
		textInSvg.appendChild(textNode(i.toString()));
		svg.appendChild(textInSvg);
	}
	for (var i = leastIntegerY; i <= largestIntegerY; i += 1n) {
		var horizontalLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
		var t = height.substract(half.substract(y1).add(new Fraction(i)).multiply(scale));
		horizontalLine.setAttribute("x1", fractionToDecimal(zero));
		horizontalLine.setAttribute("y1", fractionToDecimal(t));
		horizontalLine.setAttribute("x2", fractionToDecimal(width));
		horizontalLine.setAttribute("y2", fractionToDecimal(t));
		if (i === 0n) {
			horizontalLine.setAttribute("stroke", "black");
		} else {
			horizontalLine.setAttribute("stroke", "gray");
			horizontalLine.setAttribute("stroke-dasharray", "4");
			var textInSvg = document.createElementNS("http://www.w3.org/2000/svg", "text");
			textInSvg.setAttribute("x", fractionToDecimal(half.substract(x1).add(new Fraction(1, 10)).multiply(scale)));
			textInSvg.setAttribute("y", fractionToDecimal(height.substract(half.substract(y1).add(new Fraction(i)).add(new Fraction(1, 10)).multiply(scale))));
			textInSvg.appendChild(textNode(i.toString()));
			svg.appendChild(textInSvg);
		}
		svg.appendChild(horizontalLine);
	}
}

function makeSVG(place, x1, x2, y1, y2, scale) {
	var zero = new Fraction(0), half = new Fraction(1, 2), unit = new Fraction(1);
	var width = x2.substract(x1).add(unit).multiply(scale);
	var height = y2.substract(y1).add(unit).multiply(scale);
	var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
	svg.setAttribute("width", fractionToDecimal(width));
	svg.setAttribute("height", fractionToDecimal(height));
	place.appendChild(svg);
	var defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
	var marker = document.createElementNS("http://www.w3.org/2000/svg", "marker");
	var polygon = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
	polygon.setAttribute("points", "0 0, 10 3.5, 0 7");
	marker.appendChild(polygon);
	marker.setAttribute("id", "arrowhead");
	marker.setAttribute("markerWidth", "10");
	marker.setAttribute("markerHeight", "7");
	marker.setAttribute("refX", "10");
	marker.setAttribute("refY", "3.5");
	marker.setAttribute("orient", "auto");
	defs.appendChild(marker);
	svg.appendChild(defs);
	return svg;
}

LinearProgrammingProblem.prototype.draw = function(place, plans = undefined, scale = new Fraction(50)) {
	var numberOfVariables = this.objective.linexp.coeffs.length;
	if (numberOfVariables !== 2) {
		var paragraph = document.createElement("p");
		paragraph.appendChild(textNode("Mainīgo skaits nav vienāds ar 2, tāpēc neko nezīmēšu."));
		place.appendChild(paragraph);
		return;
	}

	var zero = new Fraction(0), half = new Fraction(1, 2), unit = new Fraction(1);
	var info = this.polytope.information();
	var x1 = info["boundaries"][0][0], x2 = info["boundaries"][0][1];
	var y1 = info["boundaries"][1][0], y2 = info["boundaries"][1][1];

	if (info["nonempty"]) {
		if (info["bounded"]) {
			var svg = makeSVG(place, x1, x2, y1, y2, scale);
			drawAxisEtc(svg, x1, x2, y1, y2, scale);
			this.polytope.drawIfBounded(svg, x1, x2, y1, y2, scale, plans);
		} else {
			var verticesAsFractions = info["vertices"];
			if (verticesAsFractions.length === 0) {
				var paragraph = document.createElement("p");
				paragraph.appendChild(textNode("Šāda veida neierobežotu plānu kopu vēl neprotu uzzīmēt."));
				place.appendChild(paragraph);
				return;
			}
			var minX = verticesAsFractions[0][0], maxX = verticesAsFractions[0][0];
			var minY = verticesAsFractions[0][1], maxY = verticesAsFractions[0][1];
			for (var i = 1; i < verticesAsFractions.length; i++) {
				if (verticesAsFractions[i][0].lessThan(minX))
					minX = verticesAsFractions[i][0];
				if (maxX.lessThan(verticesAsFractions[i][0]))
					maxX = verticesAsFractions[i][0];
				if (verticesAsFractions[i][1].lessThan(minY))
					minY = verticesAsFractions[i][1];
				if (maxY.lessThan(verticesAsFractions[i][1]))
					maxY = verticesAsFractions[i][1];
			}
			var newPolytope = this.polytope.copy();
			if (x1 === undefined) {
				newPolytope.constraints.push(new LinearConstraint(new LinearExpression([unit, zero]), minX.substract(unit), "ge"));
				x1 = minX;
			}
			if (x2 == undefined) {
				newPolytope.constraints.push(new LinearConstraint(new LinearExpression([unit, zero]), maxX.add(unit), "le"));
				x2 = maxX;
			}
			if (y1 === undefined) {
				newPolytope.constraints.push(new LinearConstraint(new LinearExpression([zero, unit]), minY.substract(unit), "ge"));
				y1 = minY;
			}
			if (y2 === undefined) {
				newPolytope.constraints.push(new LinearConstraint(new LinearExpression([zero, unit]), maxY.add(unit), "le"));
				y2 = maxY;
			}
			var svg = makeSVG(place, x1, x2, y1, y2, scale);
			drawAxisEtc(svg, x1, x2, y1, y2, scale);
			newPolytope.drawIfBounded(svg, x1, x2, y1, y2, scale, plans);
			return;
		}
	} else {
		var paragraph = document.createElement("p");
		paragraph.appendChild(textNode("Plānu kopa ir tukša jeb nesaderīga, tāpēc neko nezīmēšu."));
		place.appendChild(paragraph);
		return;
	}
}
