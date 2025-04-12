// src/app/page.tsx
'use client'

import { useState, useEffect } from 'react'
import supabase from '../lib/supabaseClient'

type Todo = {
  id: number
  task: string
  completed: boolean
}

export default function Home() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [newTask, setNewTask] = useState<string>('')

  // Fetching data from Supabase
  const fetchTodos = async () => {
    const { data, error } = await supabase.from('todos').select('*')
    if (error) {
      console.error('Error fetching todos:', error)
    } else {
      setTodos(data || [])
    }
  }

  // Adding a new todo to Supabase
const addTodo = async () => {
  if (newTask) {
    const { data, error } = await supabase.from('todos').insert([
      { task: newTask, completed: false },
    ])

    if (error) {
      console.error('Error adding todo:', error.message || error)
    } else {
      if (data) {
        // If data is not null or undefined
        if (Array.isArray(data)) {
          // If data is an array, spread it into the state
          setTodos([...todos, ...data])
        } else {
          // If data is not an array but an object, handle accordingly
          console.error('Data returned is not an array:', data)
        }
      } else {
        console.error('No data returned:', data)
      }

      setNewTask('') // Reset input after task is added
    }
  }
}

  // Fetch todos on page load
  useEffect(() => {
    fetchTodos()
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-black-50">
      <div className="max-w-2xl w-full p-6 bg-white rounded-lg shadow-lg">
        <h1 className="text-4xl font-bold text-center text-blue-600 mb-6">To-Do List</h1>
        <ul className="space-y-4">
          {todos.map((todo) => (
            <li
              key={todo.id}
              className={`flex justify-between items-center p-4 border-b ${todo.completed ? 'bg-gray-100 line-through' : 'bg-white'}`}
            >
              <span className={`text-lg ${todo.completed ? 'text-gray-500' : 'text-black'}`}>{todo.task}</span>
            </li>
          ))}
        </ul>

        <h2 className="text-black text-2xl font-semibold mt-6 mb-4 text-center">Add a New Task</h2>
        <div className="flex gap-4 justify-center">
          <input
            type="text"
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            placeholder="New task"
            className="text-black w-2/3 p-3 border-2 border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={addTodo}
            className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500"
          >
            Add Task
          </button>
        </div>
      </div>
    </div>
  )
}
