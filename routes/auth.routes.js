const {Router} = require('express')
const bcrypt = require('bcryptjs')
const config = require('config')
const jwt = require('jsonwebtoken')
const {check, validationResult} = require('express-validator')
const User = require('../models/User')
const router = Router()

// /api/auth/register
router.post(
  '/register',
  [
    check('email', 'email is incorrect').normalizeEmail().isEmail(),
    check('password', 'minimum length of password is 6 items').isLength({
      min: 6
    }),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req)

      if (!errors.isEmpty()) {
        return res.status(400).json({
          errors: errors.array(),
          message: 'Registration data is incorrect'
        })
      }

      const { email, password } = req.body

      const candidate = await User.findOne({ email })

      if (candidate) {
        return res.status(400).json({ message: 'Such user already exists' })
      }

      const hashedPassword = await bcrypt.hash(password, 12)
      const user = new User({ email, password: hashedPassword })

      await user.save()

      res.status(201).json({ message: 'User created' })
    } catch (e) {
      res.status(500).json({ message: 'Something go wrong. Try again' })
    }
  }
)

// ./api/auth/login
router.post(
  '/login',
  [
    check('email', 'email is incorrect').normalizeEmail().isEmail(),
    check('password', 'enter password').exists()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req)

      if (!errors.isEmpty()) {
        return res.status(400).json({
          errors: errors.array(),
          message: 'You can not sign in. Data is incorrect'
        })
      }

      const { email, password } = req.body

      const user = await User.findOne({ email })

      if (!user) {
        return res.status(400).json({ message: 'User not found' })
      }

      const isMatch = await bcrypt.compare(password, user.password)

      if (!isMatch) {
        return res
          .status(400)
          .json({ message: 'The password is not correct. Try again' })
      }

      const token = jwt.sign(
        { userId: user.id }, 
        config.get('jwtSecret'), 
        { expiresIn: '1h' }
      )

      res.json({ token, userId: user.id })

    } catch (e) {
      res.status(500).json({ message: 'Something go wrong. Try again :(((' })
    }
  }
)

module.exports = router
