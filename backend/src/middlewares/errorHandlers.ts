import {Response, Request, NextFunction} from "express";
import path from "path";
require("dotenv").config();

export function errorHandler(error: any, req: Request, res: Response, next: NextFunction) {
  // Log de l'erreur
  console.error({
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get("User-Agent"),
  });

  // Erreur par défaut
  let statusCode = error.statusCode || 500;
  let message = error.message || "Internal Server Error";
  let code = error.code || "INTERNAL_ERROR";

  // Gestion des erreurs spécifiques de MongoDB
  if (error.name === "ValidationError") {
    statusCode = 400;
    message = "Validation Error";
    code = "VALIDATION_ERROR";
  }

  if (error.name === "CastError") {
    statusCode = 400;
    message = "Invalid ID format";
    code = "INVALID_ID";
  }

  if (error.name === "MongoServerError" && error.code === 11000) {
    statusCode = 409;
    message = "Duplicate field value";
    code = "DUPLICATE_FIELD";
  }

  // Gestion des erreurs JWT
  if (error.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Invalid token";
    code = "INVALID_TOKEN";
  }

  if (error.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Token expired";
    code = "TOKEN_EXPIRED";
  }

  // // Si c'est une erreur 403 et une requête HTML, servir la page 403
  // if (statusCode === 403 && req.headers.accept && req.headers.accept.includes('text/html')) {
  //   return res.status(403).sendFile(path.join(__dirname, '../html/403.html'));
  // }

  // // Si c'est une erreur 500 et une requête HTML, servir la page 500
  // if (statusCode >= 500 && req.headers.accept && req.headers.accept.includes('text/html')) {
  //   return res.status(statusCode).sendFile(path.join(__dirname, '../html/500.html'));
  // }

  // Réponse d'erreur
  const errorResponse: { error: string; code: string; timestamp: string; path: string; method: string; stack?: string } = {
    error: message,
    code,
    timestamp: new Date().toISOString(),
    path: req.url,
    method: req.method,
  };

  // En développement, inclure la stack trace
  if (process.env.NODE_ENV === "development") {
    errorResponse.stack = error.stack;
  }

  res.status(statusCode).json(errorResponse);
};

/**
 * Middleware pour gérer les routes non trouvées
 */
export function notFoundHandler (req: Request, res: Response) {
  // Toujours retourner du JSON (pas de HTML)
  res.status(404).json({
    error: `Route ${req.originalUrl} not found`,
    code: "NOT_FOUND",
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.originalUrl,
    message: "Cette route n'existe pas sur l'API AfriBourse"
  });
};

/**
 * Classe pour créer des erreurs personnalisées
 */
class CustomError extends Error {
  error;
  statusCode;
  code;
  isOperational;

  constructor(message: string, statusCode: number, code: string) {
    super(message);
    this.error = message;
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Fonctions utilitaires pour créer des erreurs courantes
 * L'objet général contient des méthodes qui créent des erreurs
 * courantes dans l'app avec notre CustomError, ça lance des Error
 * (je vois ça en exception comme en PHP désolé)
 * On peut utiliser ces fonctions dans les controlleurs,
 * le middleware qui attrape toutes les erreurs s'en occupera.
 */
export const createError = {
  badRequest: (message: string, code = "BAD_REQUEST") =>
    new CustomError(message, 400, code),

  unauthorized: (message: string, code = "UNAUTHORIZED") =>
    new CustomError(message, 401, code),

  forbidden: (message: string, code = "FORBIDDEN") =>
    new CustomError(message, 403, code),

  notFound: (message: string, code = "NOT_FOUND") =>
    new CustomError(message, 404, code),

  conflict: (message: string, code = "CONFLICT") => new CustomError(message, 409, code),

  internal: (message: string, code = "INTERNAL_ERROR") =>
    new CustomError(message, 500, code),
};
