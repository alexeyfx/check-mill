use axum::{
    Router,
    extract::{
        State,
        ws::{Message, WebSocket, WebSocketUpgrade},
    },
    response::IntoResponse,
    routing::get,
};
use std::sync::Arc;

struct AppState {}

#[tokio::main]
async fn main() {
    let app_state = Arc::new(AppState {});

    let routes = Router::new()
        .route("/ws", get(websocket_handler))
        .with_state(app_state);

    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await.unwrap();

    axum::serve(listener, routes).await.unwrap();
}

async fn websocket_handler(
    State(state): State<Arc<AppState>>,
    ws: WebSocketUpgrade,
) -> impl IntoResponse {
    ws.on_upgrade(move |socket| websocket(state, socket))
}

async fn websocket(_state: Arc<AppState>, mut socket: WebSocket) {
    while let Some(Ok(message)) = socket.recv().await {
        match message {
            Message::Text(_text) => {}
            Message::Binary(_bytes) => {}
            Message::Close(_frame) => break,
            _ => {}
        }
    }
}
