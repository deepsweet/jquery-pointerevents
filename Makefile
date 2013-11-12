BIN = ./node_modules/.bin
FILE = 'jquery-pointerevents'
HEADER = "`cat src/header.js`"

eslint:
	@$(BIN)/eslint src/

jscs:
	@$(BIN)/jscs src/

test: eslint jscs

strip:
	@$(BIN)/uglifyjs src/$(FILE).js \
		-b indent-level=4 \
		-o $(FILE).js \
		--preamble $(HEADER)

min:
	@$(BIN)/uglifyjs src/$(FILE).js \
		-c -m \
		--preamble $(HEADER) \
		--source-map $(FILE).min.js.map \
		-o $(FILE).min.js

dist: strip min

version:
	@sed -i '' 's/\("version": \)".*"/\1"$(v)"/' \
		bower.json \
		package.json \
		pointerevents.jquery.json

	@sed -i '' 's/\(@version\).*/\1 $(v)/' src/jquery-pointerevents.js
	@sed -i '' 's/ v.*/ v$(v)/' src/header.js

.PHONY: eslint jscs test min strip dist version
