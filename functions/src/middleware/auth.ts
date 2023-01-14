import { getAuth, UserRecord} from 'firebase-admin/auth'
import { Request, Response, NextFunction } from "express"

export interface AuthenticatedRequest extends Request {
  user: UserRecord
}

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.split(' ')[1] || ''
    const decodedToken = await getAuth().verifyIdToken(token);
    const user = await getAuth().getUser(decodedToken.uid);
    (<AuthenticatedRequest>req)['user'] = user
    return next()
  } catch (error) {
    res.status(401).send({
      error: 'INVALID_TOKEN'
    })
  }
}
