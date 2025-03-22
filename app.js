const express = require('express')
const path = require('path')

const dbpath = path.join(__dirname, 'todoApplication.db')

const app = express()
app.use(express.json())

const {open} = require('sqlite')
const sqlite3 = require('sqlite3')

let db = null

const toDate = require('date-fns/toDate')
const format = require('date-fns/format')
const isValid = require('date-fns/isValid')

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server Running at http://localhost:3000/')
    })
  } catch (e) {
    console.log(`DB Error: ${e.message}`)
    process.exit(1)
  }
}

initializeDbAndServer()

const checkPossibleQueryValue = async (request, response, next) => {
  const {category, priority, status} = request.query

  const categoryPossibleValues = ['WORK', 'HOME', 'LEARNING']
  const priorityPossibleValues = ['HIGH', 'MEDIUM', 'LOW']
  const statusPossibleValues = ['TO DO', 'IN PROGRESS', 'DONE']

  if (category !== undefined) {
    var isPossibleValue = categoryPossibleValues.includes(category)
    if (!isPossibleValue) {
      response.status(400)
      response.send('Invalid Todo Category')
      return
    }
  }

  if (priority !== undefined) {
    var isPossibleValue = priorityPossibleValues.includes(priority)
    if (!isPossibleValue) {
      response.status(400)
      response.send('Invalid Todo Priority')
      return
    }
  }

  if (status !== undefined) {
    var isPossibleValue = statusPossibleValues.includes(status)
    if (!isPossibleValue) {
      response.status(400)
      response.send('Invalid Todo Status')
      return
    }
  }

  next()
}

const checkAndFormatDate = async (request, response, next) => {
  const {date} = request.query
  if (date !== undefined) {
    try {
      const mydate = new Date(date)
      const formatedDate = format(new Date(mydate), 'yyyy-MM-dd')
      console.log(formatedDate)

      const resultDate = toDate(
        new Date(
          `${mydate.getFullYear()}-${
            mydate.getMonth() + 1
          }-${mydate.getDate()}`,
        ),
      )
      const isValidDate = await isValid(resultDate)

      if (isValidDate) {
        request.date = formatedDate
        console.log(request.date)
      } else {
        response.status(400)
        response.send('Invalid Due Date')
      }
    } catch (e) {
      console.log(`Error: ${e.message}`)
      response.status(400)
      response.send('Invalid Due Date')
      return
    }
  }

  next()
}

const checkPossibleBodyValue = async (request, response, next) => {
  const {category, priority, status, dueDate} = request.body

  const categoryPossibleValues = ['WORK', 'HOME', 'LEARNING']
  const priorityPossibleValues = ['HIGH', 'MEDIUM', 'LOW']
  const statusPossibleValues = ['TO DO', 'IN PROGRESS', 'DONE']

  if (category !== undefined) {
    var isPossibleValue = categoryPossibleValues.includes(category)
    if (!isPossibleValue) {
      response.status(400)
      response.send('Invalid Todo Category')
      return
    }
  }

  if (priority !== undefined) {
    var isPossibleValue = priorityPossibleValues.includes(priority)
    if (!isPossibleValue) {
      response.status(400)
      response.send('Invalid Todo Priority')
      return
    }
  }

  if (status !== undefined) {
    var isPossibleValue = statusPossibleValues.includes(status)
    if (!isPossibleValue) {
      response.status(400)
      response.send('Invalid Todo Status')
      return
    }
  }

  if (dueDate !== undefined) {
    try {
      const mydate = new Date(dueDate)
      const formatedDate = format(new Date(mydate), 'yyyy-MM-dd')
      console.log(formatedDate)

      const resultDate = toDate(
        new Date(
          `${mydate.getFullYear()}-${
            mydate.getMonth() + 1
          }-${mydate.getDate()}`,
        ),
      )
      const isValidDate = await isValid(resultDate)

      if (isValidDate) {
        request.dueDate = formatedDate
        console.log(request.dueDate)
      } else {
        response.status(400)
        response.send('Invalid Due Date')
      }
    } catch (e) {
      console.log(`Error: ${e.message}`)
      response.status(400)
      response.send('Invalid Due Date')
      return
    }
  }

  next()
}
//API 1:
app.get(
  '/todos/',
  checkPossibleQueryValue,
  checkAndFormatDate,
  async (request, response) => {
    const {
      category = '',
      priority = '',
      status = '',
      search_q = '',
    } = request.query
    const getTodosQuery = `
  SELECT *
  FROM todo
  WHERE todo LIKE '%${search_q}%' AND category LIKE '%${category}%'
  AND status LIKE '%${status}%' AND priority LIKE '%${priority}%';`

    const getTodosResponse = await db.all(getTodosQuery)
    response.send(
      getTodosResponse.map(eachResponse => ({
        id: eachResponse.id,
        todo: eachResponse.todo,
        priority: eachResponse.priority,
        status: eachResponse.status,
        category: eachResponse.category,
        dueDate: eachResponse.due_date,
      })),
    )
    console.log(getTodosResponse)
  },
)

//API 2:
app.get(
  '/todos/:todoId/',
  checkPossibleQueryValue,
  checkAndFormatDate,
  async (request, response) => {
    const {todoId} = request.params
    const getTodoById = `
  SELECT *
  FROM todo
  WHERE id = ${todoId};`

    const getByIdResponse = await db.get(getTodoById)
    response.send({
      id: getByIdResponse.id,
      todo: getByIdResponse.todo,
      priority: getByIdResponse.priority,
      status: getByIdResponse.status,
      category: getByIdResponse.category,
      dueDate: getByIdResponse.due_date,
    })
  },
)

//API 3:
app.get(
  '/agenda/',
  checkPossibleQueryValue,
  checkAndFormatDate,
  async (request, response) => {
    const {date} = request
    console.log(date)
    const getByDateQuery = `
  SELECT 
    id,
    todo,
    priority,
    status,
    category,
    due_date AS dueDate
  FROM todo
  WHERE due_date = '${date}';`
    const byDateResponse = await db.all(getByDateQuery)
    response.send(byDateResponse)
  },
)

//API 4:
app.post('/todos/', checkPossibleBodyValue, async (request, response) => {
  const {id, todo, category, priority, status, dueDate} = request.body
  const formatedDueDate = format(new Date(dueDate), 'yyyy-MM-dd')
  const postTodosQuery = `
  INSERT INTO todo (id, todo, priority, status, category, due_date)
  VALUES (${id}, '${todo}', '${priority}', '${status}', '${category}', '${formatedDueDate}');`
  const postResponse = await db.run(postTodosQuery)
  response.send('Todo Successfully Added')
  console.log({id: postResponse.lastID})
})

//API 5:
app.put(
  '/todos/:todoId/',
  checkPossibleBodyValue,
  async (request, response) => {
    const {todoId} = request.params

    let updatedColumn = null

    const previousTodoQuery = `
    SELECT *
    FROM todo
    WHERE id = ${todoId};`
    const previousTodo = await db.get(previousTodoQuery)
    console.log(previousTodo)

    const {
      todo = previousTodo.todo,
      category = previousTodo.category,
      priority = previousTodo.priority,
      status = previousTodo.status,
      dueDate = previousTodo.due_date,
    } = request.body
    const putTodoQuery = `
    UPDATE todo 
    SET todo = '${todo}', priority = '${priority}', status = '${status}', category = '${category}', due_date = '${dueDate}'
    WHERE id = ${todoId};`
    await db.run(putTodoQuery)

    switch (true) {
      case request.body.status !== undefined:
        updatedColumn = 'Status'
        break
      case request.body.priority !== undefined:
        updatedColumn = 'Priority'
        break
      case request.body.todo !== undefined:
        updatedColumn = 'Todo'
        break
      case request.body.category !== undefined:
        updatedColumn = 'Category'
        break
      case request.body.dueDate !== undefined:
        updatedColumn = 'Due Date'
        break
    }
    response.send(`${updatedColumn} Updated`)
  },
)

//API 6
app.delete('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const deleteTodo = `
  DELETE FROM todo
  WHERE id = ${todoId};`
  await db.run(deleteTodo)
  response.send('Todo Deleted')
})

module.exports = app
