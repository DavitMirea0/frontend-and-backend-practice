import { api } from "../api/index.js";

export default function LoginPage() {
  const handle = async () => {
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
    
        api.auth({ email, password });
  };

  return (
    <div className="page">
      <div className="form-t">
        <label htmlFor="email">Email: </label>
        <input type="email" name="email" id="email" required />
      </div>
      <div className="form-t">
        <label htmlFor="password">Password: </label>
        <input type="password" name="password" id="password" required />
      </div>
      <button onClick={handle}>Авторизироваться</button>
    </div>
  );
}