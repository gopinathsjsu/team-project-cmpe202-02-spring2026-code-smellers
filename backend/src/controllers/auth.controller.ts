import { Request, Response } from "express";
import { getSupabaseClient } from "../lib/supabase";

//Functions like an class/interface for expected User Register Request content
//Uses optional ("?") field for input validation using the validateRegisterBody function
//NOTE: not sure if displayName is required, or if it should be fullName instead
type RegisterRequestBody = {
	email?: string;
	password?: string;
	displayName?: string;
	role?: "attendee" | "organizer" | "admin";
};

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
					role: registerReqDetails.role ?? "attendee", //default to "attendee" role
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
			userId: authUserId,
			email: registerReqDetails.email,
			displayName: registerReqDetails.displayName,
			role: registerReqDetails.role ?? "attendee",
		};
        //Insert user row into DB with supabase
		const { data: createdUser, error: createUserError } = await supabase
			.from("users")
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