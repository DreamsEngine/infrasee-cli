#!/bin/bash

# Add dreamsflare alias to shell config
echo "Adding dreamsflare alias to your shell configuration..."

# Check for Fish shell config
if [ -d "$HOME/.config/fish" ]; then
    # Fish shell
    mkdir -p ~/.config/fish/functions
    echo "function dip" > ~/.config/fish/functions/dip.fish
    echo "    dreamsflare ip \$argv" >> ~/.config/fish/functions/dip.fish
    echo "end" >> ~/.config/fish/functions/dip.fish
    echo "Fish function added to ~/.config/fish/functions/dip.fish"
    echo "The function is immediately available in Fish shell"
elif [ -n "$ZSH_VERSION" ]; then
    # Zsh
    echo "alias dip='dreamsflare ip'" >> ~/.zshrc
    echo "Alias added to ~/.zshrc"
    echo "Run 'source ~/.zshrc' to activate"
elif [ -n "$BASH_VERSION" ]; then
    # Bash
    echo "alias dip='dreamsflare ip'" >> ~/.bashrc
    echo "Alias added to ~/.bashrc"
    echo "Run 'source ~/.bashrc' to activate"
fi

echo ""
echo "You can now use 'dip <IP>' as a shortcut for 'dreamsflare ip <IP>'"