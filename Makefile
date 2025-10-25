PATH := node_modules/.bin:$(PATH)
ELECTRON_FORGE = electron-forge

# Default target
.PHONY: build clean

build:
	@$(ELECTRON_FORGE) make

clean:
	@rm -rf out/
