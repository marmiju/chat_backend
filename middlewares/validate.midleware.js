

export const validate = (schema) => (req, res, next) => {

      // Combine all possible inputs
      const payload = {
        body: req.body,
        query: req.query,
        params: req.params
      }
      const result =  schema.safeParse(payload)

      if (!result.success) {
        return res.status(422).json({
          message: result.error.issues[0].message
        })
      }

      // Attach validated data 
      req.validated = result.data

      next()
    }
