import { useNavigate } from 'react-router-dom'

function BinderList() {
    const navigate = useNavigate()

    const logout = async () => {
            const response = await fetch('http://localhost:5000/logout', {
                method: 'POST',
                credentials: 'include', //essential for flask login sessions
            })
            const data = await response.json()

            if (response.ok) {
                navigate('/login')
            }
    }

    return (    
        <div>
            <h1>Binder List</h1>
             <button onClick={() => logout()}>Logout</button>
        </div>
    )                
}

export default BinderList