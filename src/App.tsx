import { Route, Routes } from 'react-router'

function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <h1 className="text-2xl font-bold">Obesity Learning Explorer</h1>
        }
      />
    </Routes>
  )
}

export default App
