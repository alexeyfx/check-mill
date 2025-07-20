use warp::Filter;

#[tokio::main]
async fn main() {
    let greeting = warp::path!("hello" / String).map(|name| format!("Hello, {}!", name));

    warp::serve(greeting).run(([127, 0, 0, 1], 3030)).await;
}
