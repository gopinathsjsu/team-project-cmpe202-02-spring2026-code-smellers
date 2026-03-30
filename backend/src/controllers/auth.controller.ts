import { Request, Response } from "express";
import { getSupabaseClient } from "../lib/supabase";
import { RegisterRequestBody } from "../types/auth.types";

//Validation function for expected Register Request content
function validateRegisterBody(body: RegisterRequestBody): string | null {
	if (!body.email) {
		return "Missing required field: email";
	}
	if (!body.password) {
		return "Missing required field: password";
	}
    if (!body.displayName) {
		return "Missing required field: displayName";
	}
    //Password length requirement
    const passwordLengthMin = 8;
	if (body.password.length < passwordLengthMin) {
		return `Password must be at least ${passwordLengthMin} characters`;
	}
    //other validation rules can be added here (e.g. email format, password rules, etc.)
	return null;
}

/*
registerUser endpoint function has the following possible response codes:
201:  -Successful user registration (returns created user data as JSON)
400:  -Invalid user register content
      -Supabase auth entry creation error
      -DB entry creation error for "users" table
500:  -Supabase auth entry produced invalid user id 
      -Catch-all for unexpected errors
*/
export const registerUser = async (req: Request, res: Response) => {
	try {
        //Process request body as RegisterRequestBody type
		const registerReqDetails = req.body as RegisterRequestBody;

        //ErrorCheck: invalid user register request
		const invalidRequest = validateRegisterBody(registerReqDetails);
		if (invalidRequest) {
			return res.status(400).json({ error: invalidRequest });
		}

        //Use Supabase to connect to DB; create auth entry in Supabase
		const supabase = getSupabaseClient();
		const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
			email: registerReqDetails.email as string,
			password: registerReqDetails.password as string,
			options: {
				data: {
					displayName: registerReqDetails.displayName,
					is_admin: registerReqDetails.is_admin,
				},
			},
		});
        //ErrorCheck: Supabase auth entry response error
		if (signUpError) {
			return res.status(400).json({ error: signUpError.message });
		}
        //ErrorCheck: missing valid user id from Supabase auth entry
		const authUserId = signUpData.user?.id;
		if (!authUserId) {
			return res
				.status(500)
				.json({ error: "User registration didn't return a (valid) user id" });
		}

        //JSON-format for insert new user row into "users" DB table
		const userRecord = {
			id: authUserId,
			email: registerReqDetails.email,
			display_name: registerReqDetails.displayName,
			is_admin: registerReqDetails.is_admin,
		};
        //Insert user row into DB with supabase
				// RECOMMENDATION: Use Postgres trigger to automatically create user record in "users" table 
				// upon new auth entry creation in Supabase, instead of doing it manually here. This would ensure 
				// data consistency and reduce potential points of failure.
		const { data: createdUser, error: createUserError } = await supabase
			.from("users")
			// FIXED: Supabase types was complaining. userRecord must match the DB table schema exactly, 
			// including required columns.
			.insert(userRecord) 
			.select("*")
			.single();
        //ErrorCheck: DB entry response error for creating user record in "users" table
		if (createUserError) {
			return res.status(400).json({ error: createUserError.message });
		}
        
        //Successful user registration (return user row as JSON)
		return res.status(201).json(createdUser);
	} catch (error) { 
        //Catch-all error handling
		return res.status(500).json({
			error: error instanceof Error ? error.message : "Unexpected error",
		});
	}
};