## cmd run docker 
## docker compose ps 
## cmd check mysql and service 
## docker compose config --services

Service	Localhost	Status
Laravel Backend	http://localhost:8010	ត្រូវ Start Laravel
React Frontend	http://localhost:5176	ត្រូវ Start React
phpMyAdmin	http://localhost:8086	ត្រូវ Setup phpMyAdmin
MySQL	localhost:3310	Database connection only

Step 7 — Docker commands for daily development
Action	Command
Start all	docker compose up -d
Stop all	docker compose down
Rebuild	docker compose up -d --build
Check status	docker compose ps
Laravel commands	docker compose exec app php artisan ...
React commands	docker compose exec frontend npm ...
View logs	docker compose logs -f