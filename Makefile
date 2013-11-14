BIN = ./node_modules/.bin
SCRIPT = 'jquery-pointerevents'
HEADER = "`cat src/header.js`"

eslint:
	@$(BIN)/eslint src/

jscs:
	@$(BIN)/jscs src/

mocha:
	@$(BIN)/mocha-phantomjs test/test.html

test: eslint jscs mocha

strip:
	@$(BIN)/uglifyjs src/$(SCRIPT).js \
		-b indent-level=4 \
		-o $(SCRIPT).js \
		--preamble $(HEADER)

min:
	@$(BIN)/uglifyjs src/$(SCRIPT).js \
		-c -m \
		--preamble $(HEADER) \
		--source-map $(SCRIPT).min.js.map \
		-o $(SCRIPT).min.js

dist: strip min

version:
	@sed -i '' 's/\("version": \)".*"/\1"$(v)"/' \
		bower.json \
		package.json \
		pointerevents.jquery.json

	@sed -i '' 's/\(@version\).*/\1 $(v)/' src/jquery-pointerevents.js
	@sed -i '' 's/ v.*/ v$(v)/' src/header.js

.PHONY: eslint jscs test coverage min strip dist version
