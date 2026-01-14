//package com.whatsapp_clone.configuration;
//
//import co.elastic.clients.elasticsearch.ElasticsearchClient;
//import co.elastic.clients.json.jackson.JacksonJsonpMapper;
//import co.elastic.clients.transport.rest_client.RestClientTransport;
//import org.apache.http.HttpHost;
//import org.elasticsearch.client.RestClient;
//import org.springframework.context.annotation.Bean;
//import org.springframework.context.annotation.Configuration;
//import org.springframework.data.elasticsearch.repository.config.EnableElasticsearchRepositories;
//
//@Configuration
//@EnableElasticsearchRepositories(basePackages = "com.whatsapp_clone.elasticsearch")
//
//public class ElasticSearchConfig {
//
//    @Bean
//    public RestClientTransport transport() {
//        RestClient restClient = RestClient.builder(
//                HttpHost.create("http://localhost:9200")
//        ).build();
//
//        return new RestClientTransport(restClient, new JacksonJsonpMapper());
//    }
//
//    @Bean
//    public ElasticsearchClient elasticsearchClient(RestClientTransport transport) {
//        return new ElasticsearchClient(transport);
//    }
//}
