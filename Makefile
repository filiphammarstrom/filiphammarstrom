.PHONY: project open clean

# Generate Xcode project from project.yml (requires xcodegen)
project:
	@which xcodegen > /dev/null 2>&1 || (echo "Install xcodegen: brew install xcodegen" && exit 1)
	xcodegen generate

# Generate and open in Xcode
open: project
	open NASBackup.xcodeproj

clean:
	rm -rf NASBackup.xcodeproj
	rm -rf .build
	rm -rf DerivedData
