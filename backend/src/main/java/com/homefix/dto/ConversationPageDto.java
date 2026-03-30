package com.homefix.dto;

import java.util.ArrayList;
import java.util.List;

public class ConversationPageDto {
    private List<ConversationMessageDto> items = new ArrayList<>();
    private long totalElements;
    private int page;
    private int size;
    private boolean hasNext;

    public List<ConversationMessageDto> getItems() {
        return items;
    }

    public void setItems(List<ConversationMessageDto> items) {
        this.items = items;
    }

    public long getTotalElements() {
        return totalElements;
    }

    public void setTotalElements(long totalElements) {
        this.totalElements = totalElements;
    }

    public int getPage() {
        return page;
    }

    public void setPage(int page) {
        this.page = page;
    }

    public int getSize() {
        return size;
    }

    public void setSize(int size) {
        this.size = size;
    }

    public boolean isHasNext() {
        return hasNext;
    }

    public void setHasNext(boolean hasNext) {
        this.hasNext = hasNext;
    }
}
