/**
 * Points d'entrée HTTP pour l'API REST
 */

function doGet(e) {
    return ApiService.handleRequest(e);
}

function doPost(e) {
    return ApiService.handleRequest(e);
}