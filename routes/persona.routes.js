const express = require('express');
const { getAllPersonas, createPersona } = require('../controllers/persona.controller');
const router = express.Router();

router.get('/', getAllPersonas);
router.post('/', createPersona);

module.exports = router;
