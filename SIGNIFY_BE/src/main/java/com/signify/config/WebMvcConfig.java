package com.signify.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.io.File;

@Configuration
@Slf4j
public class WebMvcConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Define path for local animations folder outside classpath
        String absolutePath = new File("assets/animations").getAbsolutePath();
        File folder = new File("assets/animations");
        
        if (!folder.exists()) {
            boolean created = folder.mkdirs();
            if (created) {
                log.info("🧬 [WebMvcConfig] Created local animations folder dynamically at: {}", absolutePath);
            } else {
                log.warn("🧬 [WebMvcConfig] Failed to create local animations folder at: {}", absolutePath);
            }
        } else {
            log.info("🧬 [WebMvcConfig] Local animations folder serving from: {}", absolutePath);
        }

        // Map http://127.0.0.1:8080/assets/animations/** to BOTH physical directory and classpath static folder
        registry.addResourceHandler("/assets/animations/**")
                .addResourceLocations("file:" + absolutePath + "/")
                .addResourceLocations("classpath:/static/assets/animations/");
    }
}
