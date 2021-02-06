import { UsernamePasswordInput } from "src/resolvers/UsernamePasswordInput"

export const validateRegister = (options: UsernamePasswordInput) => {
    if (!options.email.includes("@")) {            
        return [
            {
                field: 'email',
                message: 'Invalid Email'
            },
        ]
        
    }
    if (options.username.length <= 2) {            
        return [
            {
                field: 'username',
                message: 'Username must be greater than 2 characters'
            },
        ]
        
    }
    if (options.username.includes('@')) {            
        return [
            {
                field: 'username',
                message: 'Cannot include @ sign'
            },
        ]
        
    }

    if (options.password.length <= 2) {
        return  [
            {
                field: 'password',
                message: 'Password must be greater than 2 characters'
            },
        ]
        
    }

    return null; // No errors were found
}