localization = {};

localization["number_of_variables"] = {};
localization["number_of_variables"]["lv"] = "Mainīgo skaits";
localization["number_of_variables"]["en"] = "Number of variables";

localization["number_of_linear_constraints"] = {};
localization["number_of_linear_constraints"]["lv"] = "Lineāro ierobežojumu skaits";
localization["number_of_linear_constraints"]["en"] = "Number of linear constraints";

localization["enter_integers_bigger_than_zero"] = {};
localization["enter_integers_bigger_than_zero"]["lv"] = "Ievadi veselus skaitļus, kas lielāki par nulli!";
localization["enter_integers_bigger_than_zero"]["en"] = "Enter integers bigger than zero!";

localization["choose_max_or_min"] = {};
localization["choose_max_or_min"]["lv"] = "Izvēlies 'max', ja vēlies maksimizēt mērķa funkciju, vai arī 'min', ja vēlies to minimizēt";
localization["choose_max_or_min"]["en"] = "Choose 'max', if you want to maximise objective function, or choose 'min', if you want to minimize it";

localization["enter_the_objective_function"] = {};
localization["enter_the_objective_function"]["lv"] = "Ievadi mērķa funkcijas koeficientus!";
localization["enter_the_objective_function"]["en"] = "Enter coefficients of the objective function!";

localization["enter_constraints"] = {};
localization["enter_constraints"]["lv"] = "Ievadi LPU ierobežojumus (koeficientus, zīmes, konstantes)!";
localization["enter_constraints"]["en"] = "Enter constraints of the LPP (coefficients, signs, constants)!";

localization["enter_nonnegative_variables"] = {};
localization["enter_nonnegative_variables"]["lv"] = "Ieraksti kārtas numurus (sākot no 1 un atdalot ar atstarpi) mainīgajiem, kuriem jābūt nenegatīviem!";
localization["enter_nonnegative_variables"]["en"] = "Enter numbers of variables (starting from 1 and separated by space) that has to be nonnegative!";

localization["wrong_coefficient_of_the_objective"] = {};
localization["wrong_coefficient_of_the_objective"]["lv"] = (x) => "Mērķa funkcijas " + x + ". koeficients nav ievadīts pareizi!";
localization["wrong_coefficient_of_the_objective"]["en"] = (x) => "Coefficient No. " + x + " of the objective function must be corrected!";

localization["wrong_coefficient_of_constraint"] = {};
localization["wrong_coefficient_of_constraint"]["lv"] = (x, y) => x + ". ierobežojuma " + y + ". koeficients nav ievadīts pareizi!";
localization["wrong_coefficient_of_constraint"]["en"] = (x, y) => "Coefficient No. " + y + " of constraint No. " + x + " must be corrected!";

localization["wrong_constant_of_constraint"] = {};
localization["wrong_constant_of_constraint"]["lv"] = (x) => x + ". ierobežojuma konstante nav ievadīta pareizi!";
localization["wrong_constant_of_constraint"]["en"] = (x) => "Constant of constraint No. " + x + " must be corrected!";

localization["error_in_the_nonnegative_list"] = {};
localization["error_in_the_nonnegative_list"]["lv"] = "Nenegatīvo mainīgo sarakstā ir kļūda!";
localization["error_in_the_nonnegative_list"]["en"] = "There is a mistake in the list of nonnegative variables!";

localization["index_less_than_1"] = {};
localization["index_less_than_1"]["lv"] = "Nenegatīvo mainīgo sarakstā ievadīts numurs, kas mazāka par 1!";
localization["index_less_than_1"]["en"] = "There is number less than 1 in the list of nonnegative variables!";

localization["index_bigger_than_number_of_variables"] = {};
localization["index_bigger_than_number_of_variables"]["lv"] = (x) => "Pavisam ir " + x + " mainīgie. Nenegatīvo mainīgo sarakstā ievadīta pārāk liels numurs!";
localization["index_bigger_than_number_of_variables"]["en"] = (x) => "Number of variables is " + x + ". There is number bigger than that in the list of nonnegative variables!";

localization["given_LPP"] = {};
localization["given_LPP"]["lv"] = "Tātad ir dots šāds LPU.";
localization["given_LPP"]["en"] = "We have such LPP.";

localization["already_canonical_form"] = {};
localization["already_canonical_form"]["lv"] = "Šis LPU jau ir kanoniskajā formā.";
localization["already_canonical_form"]["en"] = "The LPP is in the canonical form already.";

localization["replacing_variables_without_nonnegativity"] = {};
localization["replacing_variables_without_nonnegativity"]["lv"] = "Katru mainīgo bez nenegativitātes ierobežojuma aizvietojam ar divu nenegatīvu mainīgo starpību:";
localization["replacing_variables_without_nonnegativity"]["en"] = "Each variable without nonnegativity constraint is replaced with difference of two nonnegative variables:";

localization["replaced_with"] = {};
localization["replaced_with"]["lv"] = "aizvietojam ar";
localization["replaced_with"]["en"] = "replaced with";

localization["LPP_transformed_into_canonical_form"] = {};
localization["LPP_transformed_into_canonical_form"]["lv"] = "Dotais LPU kanoniskā formā:";
localization["LPP_transformed_into_canonical_form"]["en"] = "Given LPP in the canonical form:";

localization["Auxiliary_problem_has_to_be_solved"] = {};
localization["Auxiliary_problem_has_to_be_solved"]["lv"] = "Redzams, ka šim LPU ir jārisina palīgproblēma. Veidojam tabulu:";
localization["Auxiliary_problem_has_to_be_solved"]["en"] = "Auxiliary problem has to be solved. Let's make the table:";

localization["Preparation_of_table_of_auxiliary_problem"] = {};
localization["Preparation_of_table_of_auxiliary_problem"]["lv"] = "Panākam, ka tabulas pēdējā rindā pretī mākslīgiem mainīgiem būtu nulles (atņemam no tās visas rindas, kas atbilst mākslīgiem mainīgiem).";
localization["Preparation_of_table_of_auxiliary_problem"]["en"] = "We have to make zeros in the last row against artificial variables (to do that we substract all rows that correspond to artificial variables from the last row).";

localization["One_row_to_substract_(auxiliary_problem)"] = {};
localization["One_row_to_substract_(auxiliary_problem)"]["lv"] = (x) => "Atņemam no pēdējās rindas " + (x + 1).toString() + ". rindu. Iegūstam šādu tabulu:";
localization["One_row_to_substract_(auxiliary_problem)"]["en"] = (x) => "We substract row No. " + (x + 1).toString() + " from the last row. The table now is:";

localization["Multiple_rows_to_substract_(auxiliary_problem)"] = {};
localization["Multiple_rows_to_substract_(auxiliary_problem)"]["lv"] = function(x) {
	var s = "Atņemam no pēdējās rindas " + (x[0] + 1).toString() + ".";
	for (var i = 1; i < x.length - 1; i++) {
		s += ", " + (x[i] + 1).toString() + ".";
	}
	s += " un " + (x[x.length - 1] + 1).toString() + ". rindu, iegūstot šādu tabulu:";
	return s;
}
localization["Multiple_rows_to_substract_(auxiliary_problem)"]["en"] = function(x) {
	var s = "We substract rows ";
	for (var i = 0; i < x.length; i++) {
		s += "No. " + (x[i] + 1).toString() + ", ";
	}
	s += "resulting in such table:";
	return s;
};

localization["start_iterations_(auxiliary_problem)"] = {};
localization["start_iterations_(auxiliary_problem)"]["lv"] = "Uzsākam simpleksa algoritma iterāciju procesu, lai atrisinātu palīgproblēmu.";
localization["start_iterations_(auxiliary_problem)"]["en"] = "We start iteration process (of the simplex algorithm) to solve auxiliary problem.";

localization["resulting_table"] = {};
localization["resulting_table"]["lv"] = "Iegūta šāda tabula:";
localization["resulting_table"]["en"] = "Resulting table:";

localization["feasible_plan_found"] = {};
localization["feasible_plan_found"]["lv"] = "Palīgproblēmas mērķa funkcijas maksimālā vērtība ir nulle, tātad ir atrasts atbalsta plāns.";
localization["feasible_plan_found"]["en"] = "Maximum value of the goal function (for auxiliary problem) is zero. That means that a feasible plan is found.";

localization["remove_columns_of_artificial_variables"] = {};
localization["remove_columns_of_artificial_variables"]["lv"] = "Izņemam kolonnas, kuras atbilst mākslīgiem mainīgiem, iegūstot šādu tabulu:";
localization["remove_columns_of_artificial_variables"]["en"] = "We remove columns corresponding to the artificial variables, resulting in such table:";

localization["last_row_according_to_objective"] = {};
localization["last_row_according_to_objective"]["lv"] = "Aizpildām pēdējo rindu atbilstoši mērķa funkcijai.";
localization["last_row_according_to_objective"]["en"] = "We fill the last row according to the objective function:";

localization["Preparation_of_table_of_main_problem"] = {};
localization["Preparation_of_table_of_main_problem"]["lv"] = "Panākam, ka tabulas pēdējā rindā pretī bāzes mainīgiem būtu nulles.";
localization["Preparation_of_table_of_main_problem"]["en"] = "We have to make zeros in the last row against the basic variables.";

localization["substract_multiplied_row"] = {};
localization["substract_multiplied_row"]["lv"] = (x) => "Atņemam no pēdējās rindas " + (x + 1).toString() + ". rindu, pareizinātu ar ";
localization["substract_multiplied_row"]["en"] = (x) => "Substract (from the last row) row No. " + (x + 1).toString() + ", multiplied by ";

localization["set_of_plans_is_empty"] = {};
localization["set_of_plans_is_empty"]["lv"] = "Palīgproblēmas mērķa funkcijas maksimālā vērtība nav nulle, tātad sākotnējā LPU plānu kopa ir ";
localization["set_of_plans_is_empty"]["en"] = "Maximum value of the objective function (of the auxiliary problem) isn't zero, therefore the plan set of the original LPP is empty.";
localization["start_iterations"] = {};
localization["start_iterations"]["lv"] = "Uzsākam simpleksa algoritma iterāciju procesu, lai atrisinātu doto LPU.";
localization["start_iterations"]["en"] = "We start iteration process (of the simplex algorithm) to solve given LPP.";

localization["phase_II_success_part_1"] = {};
localization["phase_II_success_part_1"]["lv"] = "Iterāciju process beidzies veiksmīgi. No tabulas var nolasīt mērķa funkcijas optimālo vērtību, kas ir ";
localization["phase_II_success_part_1"]["en"] = "Iterations has finished with success. The optimal value of the objective function can be read from the table - it is ";

localization["phase_II_success_part_2"] = {};
localization["phase_II_success_part_2"]["lv"] = ", kā arī optimālo plānu, kas ir ";
localization["phase_II_success_part_2"]["en"] = ", as well as the optimal plan, which is ";

localization["original_LPP_min"] = {};
localization["original_LPP_min"]["lv"] = "Sākotnējais LPU ir minimizācijas uzdevums, tāpēc tā mērķa funkcijas optimālā (minimālā) vērtība ir pretēja iegūtajai jeb ";
localization["original_LPP_min"]["en"] = "The given LPP is problem of minimization. That means that the optimal (minimal) value of the objective function is opposite of one we have calculated: ";

localization["original_LPP_has_variables_without_nonnegativity"] = {};
localization["original_LPP_has_variables_without_nonnegativity"]["lv"] = "Sākotnējais LPU satur mainīgos bez nenegativitātes nosacījumiem, kuri tika aizvietoti ar nenegatīvu mainīgo starpību. Tātad ir jāveic attiecīgie aprēķini, lai iegūtu sākotnējā LPU optimālo plānu.";
localization["original_LPP_has_variables_without_nonnegativity"]["en"] = "The given LPP has variables without nonnegativity constraints (those were replaced by difference of two nonnegative variables). So, we have to do corresponding calculations to get the optimal plan of the given LPP.";

localization["value_of_variable_1"] = {};
localization["value_of_variable_1"]["lv"] = "Mainīgā ";
localization["value_of_variable_1"]["en"] = "Value of variable ";

localization["value_of_variable_2"] = {};
localization["value_of_variable_2"]["lv"] = " vērtība sanāk ";
localization["value_of_variable_2"]["en"] = " is ";

localization["the_optimal_plan"] = {};
localization["the_optimal_plan"]["lv"] = "Sākotnējā LPU optimālais plāns ir ";
localization["the_optimal_plan"]["en"] = "The optimal plan of the given LPP is ";

localization["unbounded_objective"] = {};
localization["unbounded_objective"]["lv"] = "Redzams, ka iterāciju process beidzies ar neveiksmi. Tas ir, LPU mērķa funkcija ir neierobežota.";
localization["unbounded_objective"]["en"] = "The iteration process has ended with failure. It means that the objective function of the LPP is unbounded.";

localization["current_plan"] = {};
localization["current_plan"]["lv"] = "Šī brīža plāns ir ";
localization["current_plan"]["en"] = "The current plan is ";