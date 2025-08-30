package main

import (
	"log"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
)

func main() {
	app := fiber.New()
	app.Use((cors.New()))

	app.Get("/hello", func(c *fiber.Ctx) error {
		return c.SendString("Hello, Fiber!")
	})

	log.Fatal(app.Listen(":3001"))
}
