# Utiliser une image de base avec Nginx
FROM nginx:alpine

# Copier les fichiers du site dans le répertoire de Nginx
COPY ./docs /usr/share/nginx/html

# Exposer le port 80
EXPOSE 80

# Commande par défaut pour démarrer Nginx
CMD ["nginx", "-g", "daemon off;"]