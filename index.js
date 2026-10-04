const express = require('express')
const app = express()
const cors = require('cors')
const mongoose = require('mongoose')
require('dotenv').config()

app.use(cors())
app.use(express.urlencoded({ extended: false }))
app.use(express.static('public'))

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB')
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err)
  })

// User Schema
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true
  }
})

const User = mongoose.model('User', userSchema)

// Exercise Schema
const exerciseSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  duration: {
    type: Number,
    required: true
  },
  date: {
    type: Date,
    required: true
  }
})

const Exercise = mongoose.model('Exercise', exerciseSchema)

// Add Exercise
app.post('/api/users/:_id/exercises', async (req, res) => {
  try {
    const user = await User.findById(req.params._id)

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    const exerciseDate = req.body.date
      ? new Date(req.body.date)
      : new Date()

    const exercise = new Exercise({
      userId: user._id,
      description: req.body.description,
      duration: Number(req.body.duration),
      date: exerciseDate
    })

    const savedExercise = await exercise.save()

    res.json({
      username: user.username,
      description: savedExercise.description,
      duration: savedExercise.duration,
      date: savedExercise.date.toDateString(),
      _id: user._id
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Create User
app.post('/api/users', async (req, res) => {
  try {
    const user = new User({
      username: req.body.username
    })

    const savedUser = await user.save()

    res.json({
      username: savedUser.username,
      _id: savedUser._id
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Get User Exercise Log
app.get('/api/users/:_id/logs', async (req, res) => {
  try {
    const user = await User.findById(req.params._id)

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    const query = {
      userId: user._id
    }

    // Filter by date range
    if (req.query.from || req.query.to) {
      query.date = {}

      if (req.query.from) {
        query.date.$gte = new Date(req.query.from)
      }

      if (req.query.to) {
        const toDate = new Date(req.query.to)
        toDate.setDate(toDate.getDate() + 1)
        query.date.$lt = toDate
      }
    }

    let exerciseQuery = Exercise.find(query)

    // Limit number of exercises
    if (req.query.limit) {
      exerciseQuery = exerciseQuery.limit(Number(req.query.limit))
    }

    const exercises = await exerciseQuery

    const log = exercises.map(exercise => ({
      description: exercise.description,
      duration: exercise.duration,
      date: exercise.date.toDateString()
    }))

    res.json({
      username: user.username,
      count: log.length,
      _id: user._id,
      log: log
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Get All Users
app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find({})
    res.json(users)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Home Page
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
})

// Start Server
const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})