export const handleError = async (response) => { //error function to neaten code
    const errData = await response.json()
    throw new Error(errData.message)
}