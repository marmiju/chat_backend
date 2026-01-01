

export const validate =
  (schema) =>
    async (req, res, next) => {

      // Combine all possible inputs
      const payload = {
        body: req.body,
        query: req.query,
        params: req.params
      }
      const result = await schema.safeParseAsync(payload)

      if (!result.success) {
        return res.status(422).json({
          message: result.error.issues[0].message
        })
      }

      // Attach validated data 
      req.validated = result.data

      next()
    }
