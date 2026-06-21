export const handleError = async (response, navigate) => { //error function to neaten code
    if (response.status >= 400 && response.status < 500) {
        const errData = await response.json()
        throw new Error(errData.message)
    } else {
        navigate('/login') //redirect users to login
    }
}