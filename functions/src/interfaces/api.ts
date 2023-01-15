export interface CustomResult<T> {
    isError: false
    data: T
}

export interface CustomError {
    isError: true
    errorCode: string
    errorMessage: string
}
