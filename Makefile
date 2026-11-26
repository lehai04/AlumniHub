.PHONY: setup dev lint format test build run deploy clean
setup:
	npm run setup
dev:
	npm run dev
lint:
	npm run lint
format:
	npm run format
test:
	npm test
build:
	npm run build
run:
	npm run run
deploy:
	npm run deploy -- "$(IMAGE)"
clean:
	npm run clean
