export const httpErrorCodes = new Map<number, string>([
    [400, 'no se pudo interpretar la solicitud dada una sintaxis inválida'],
    [401, 'Es necesario autenticar para obtener la respuesta solicitada'],
    [403, 'El cliente no posee los permisos necesarios para cierto contenido'],
    [404, 'El servidor no pudo encontrar el recurso solicitado'],
    [500, 'El servidor ha encontrado una situación que no sabe cómo manejarla']
]);
export const dbErrorCodes = new Map<string, string>([
    ['23503', 'No se puede actualizar o borrar, debido a su relación con otras entidades'],
    ['23505', 'Valor duplicado, restricción única'],
]);
export const dbError = 'Error desconocido DB';